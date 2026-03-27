import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';

// Reset web outline on focused inputs
const webInputReset = Platform.OS === 'web'
  ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
  : {};

// ─── DaData via Supabase Edge Function proxy ────────────────────────
// Token is stored server-side in the dadata-proxy Edge Function.
// Client sends requests through the proxy with Supabase auth.
const DADATA_PROXY_URL = 'https://aaghopgrlxdjsrvmbuds.supabase.co/functions/v1/dadata-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZ2hvcGdybHhkanNydm1idWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTU0ODUsImV4cCI6MjA4ODM5MTQ4NX0.kcRS5xcS5yR8ghUdhE5FJkYTB_23a0OOMzhcI-SGIzY';

export interface DaDataSuggestion {
  value: string; // "г Москва, ул Тверская, д 1, кв 5"
  unrestricted_value: string;
  data: {
    city?: string;
    city_with_type?: string;
    street_with_type?: string;
    house?: string;
    flat?: string;
    fias_id?: string;        // Unique FIAS identifier
    square?: number;         // Apartment area in m² (DaData Maximum plan)
    floor?: number;          // Floor number (DaData Maximum plan)
    floors_count?: number;   // Total floors in building (DaData Maximum plan)
    geo_lat?: string;
    geo_lon?: string;
    [key: string]: any;
  };
}

interface AddressInputProps {
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onValidated?: (validated: boolean) => void;
  onSuggestionSelected?: (suggestion: DaDataSuggestion) => void;
  level?: 'house' | 'flat'; // default: 'flat' — apartment-level suggestions
  error?: string;
}

const DEBOUNCE_MS = 300; // DaData is fast, 300ms is enough
const MIN_CHARS = 3;

export function AddressInput({
  label,
  showLabel = false,
  placeholder,
  value,
  onChangeText,
  onValidated,
  onSuggestionSelected,
  level = 'flat',
  error,
}: AddressInputProps) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<DaDataSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSearch = useRef(false);

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < MIN_CHARS) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(DADATA_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          query,
          count: 7,
          from_bound: { value: 'city' },
          to_bound: { value: level },
        }),
      });
      const json = await res.json();
      const items: DaDataSuggestion[] = json.suggestions || [];
      setSuggestions(items);
      setShowDropdown(items.length > 0);
    } catch {
      // Fallback to Nominatim if proxy is unavailable
      await searchNominatim(query);
    } finally {
      setLoading(false);
    }
  }, [level]);

  // Fallback: Nominatim (free, no API key, worse quality for Russia)
  const searchNominatim = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&countrycodes=ru&limit=5&accept-language=ru`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'BuroRemontov/1.0' },
      });
      const data = await res.json();
      // Convert Nominatim response to DaData-like format
      const items: DaDataSuggestion[] = data.map((item: any) => ({
        value: formatNominatimAddress(item.display_name),
        unrestricted_value: item.display_name,
        data: { geo_lat: item.lat, geo_lon: item.lon },
      }));
      setSuggestions(items);
      setShowDropdown(items.length > 0);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text: string) => {
    onChangeText(text);

    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    // User is typing manually — invalidate previous selection
    onValidated?.(false);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (text.length < MIN_CHARS) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      searchAddress(text);
    }, DEBOUNCE_MS);
  };

  const handleSelect = (item: DaDataSuggestion) => {
    skipNextSearch.current = true;
    onChangeText(item.value);

    // Validate that address has required detail level
    const hasHouse = !!item.data.house;
    const hasFlat = !!item.data.flat;
    const isValid = level === 'flat' ? (hasHouse && hasFlat) : hasHouse;
    onValidated?.(isValid);

    onSuggestionSelected?.(item);
    setSuggestions([]);
    setShowDropdown(false);
  };

  // Track whether the user is pressing a suggestion so blur doesn't hide dropdown
  const isPressingDropdown = useRef(false);

  const handleBlur = () => {
    setFocused(false);
    // On web, onMouseDown preventDefault prevents blur in most cases.
    // As a fallback, use a longer delay on web to let onPress fire first.
    const delay = Platform.OS === 'web' ? 300 : 150;
    setTimeout(() => {
      if (!isPressingDropdown.current) {
        setShowDropdown(false);
      }
      isPressingDropdown.current = false;
    }, delay);
  };

  return (
    <View style={styles.container}>
      {label && showLabel && (
        <Text style={[styles.label, { color: colors.heading }]}>{label}</Text>
      )}
      <View>
        <TextInput
          style={[
            styles.input,
            webInputReset,
            {
              backgroundColor: colors.bgInput,
              color: colors.heading,
            },
            focused && styles.inputFocused,
            error && { borderWidth: 1.5, borderColor: colors.danger },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => {
            setFocused(true);
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          onBlur={handleBlur}
        />
        {loading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>

      {showDropdown && suggestions.length > 0 && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: isDark ? colors.bgElevated : colors.white,
              borderColor: colors.border,
              shadowColor: isDark ? 'rgba(0,0,0,0.4)' : '#000',
            },
          ]}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(_, i) => String(i)}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.suggestion,
                  { borderBottomColor: colors.border },
                  pressed && { backgroundColor: colors.bgCard },
                ]}
                onPress={() => handleSelect(item)}
                // On web, prevent blur from closing dropdown before onPress fires
                {...(Platform.OS === 'web' ? {
                  onMouseDown: (e: any) => {
                    e.preventDefault();
                    isPressingDropdown.current = true;
                  },
                } : {})}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.primary}
                  style={styles.suggestionIcon}
                />
                <Text style={[styles.suggestionText, { color: colors.heading }]} numberOfLines={2}>
                  {item.value}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

/** Clean Nominatim display_name — remove country, postcode */
function formatNominatimAddress(displayName: string): string {
  const parts = displayName.split(', ');
  return parts
    .filter(
      (p) =>
        !/^\d{5,6}$/.test(p.trim()) &&
        p.trim() !== 'Россия' &&
        p.trim() !== 'Russia',
    )
    .join(', ');
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    zIndex: 10,
  },
  label: {
    ...typography.smallBold,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: radius.lg,
    borderWidth: 0,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...typography.body,
  },
  inputFocused: {
    // No border on focus — clean look
  },
  loadingIndicator: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginTop: 4,
    maxHeight: 260,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionIcon: {
    marginRight: spacing.sm,
  },
  suggestionText: {
    ...typography.body,
    flex: 1,
  },
  error: {
    ...typography.small,
    marginTop: spacing.xs,
  },
});
