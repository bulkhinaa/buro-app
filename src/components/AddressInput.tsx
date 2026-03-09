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
import { colors, spacing, radius, typography } from '../theme';

// Reset web outline on focused inputs
const webInputReset = Platform.OS === 'web'
  ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
  : {};

// ─── DaData configuration ───────────────────────────────────────────
// Free tier: 10,000 requests/day
// Get your token at https://dadata.ru/profile/#info
const DADATA_TOKEN = '4f5dfae6e7088a2e5f51f6be3f94337b22504878';
const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';

interface DaDataSuggestion {
  value: string; // "г Москва, ул Тверская, д 1"
  unrestricted_value: string;
  data: {
    city?: string;
    city_with_type?: string;
    street_with_type?: string;
    house?: string;
    flat?: string;
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
  error,
}: AddressInputProps) {
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

    // If no DaData token — fall back to Nominatim
    if (!DADATA_TOKEN) {
      await searchNominatim(query);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(DADATA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${DADATA_TOKEN}`,
        },
        body: JSON.stringify({
          query,
          count: 7,
          // Prioritize addresses with houses (not just streets)
          from_bound: { value: 'city' },
          to_bound: { value: 'house' },
        }),
      });
      const json = await res.json();
      const items: DaDataSuggestion[] = json.suggestions || [];
      setSuggestions(items);
      setShowDropdown(items.length > 0);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, []);

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
    onValidated?.(true);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleBlur = () => {
    setFocused(false);
    // Delay hiding to allow press on suggestion
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <View style={styles.container}>
      {label && showLabel && <Text style={styles.label}>{label}</Text>}
      <View>
        <TextInput
          style={[
            styles.input,
            webInputReset,
            focused && styles.inputFocused,
            error && styles.inputError,
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
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(_, i) => String(i)}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.suggestion,
                  pressed && styles.suggestionPressed,
                ]}
                onPress={() => handleSelect(item)}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.primary}
                  style={styles.suggestionIcon}
                />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.value}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
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
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    borderWidth: 0,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    color: colors.heading,
    ...typography.body,
  },
  inputFocused: {
    // No border on focus — clean look
  },
  inputError: {
    borderWidth: 1.5,
    borderColor: colors.danger,
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginTop: 4,
    maxHeight: 260,
    overflow: 'hidden',
    shadowColor: '#000',
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
    borderBottomColor: colors.border,
  },
  suggestionPressed: {
    backgroundColor: colors.bgCard,
  },
  suggestionIcon: {
    marginRight: spacing.sm,
  },
  suggestionText: {
    ...typography.body,
    color: colors.heading,
    flex: 1,
  },
  error: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
