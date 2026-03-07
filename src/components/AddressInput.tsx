import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressInputProps {
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

const DEBOUNCE_MS = 500;
const MIN_CHARS = 3;

export function AddressInput({
  label,
  showLabel = false,
  placeholder,
  value,
  onChangeText,
  error,
}: AddressInputProps) {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
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
      const encoded = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&countrycodes=ru&limit=5&accept-language=ru`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'BuroRemontov/1.0' },
      });
      const data: AddressSuggestion[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0);
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

  const handleSelect = (item: AddressSuggestion) => {
    skipNextSearch.current = true;
    // Clean up the display name: take a shorter readable version
    const short = formatAddress(item.display_name);
    onChangeText(short);
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
                <Text style={styles.suggestionIcon}>📍</Text>
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {formatAddress(item.display_name)}
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

function formatAddress(displayName: string): string {
  // Nominatim returns "street, city, region, country" — remove country/postcode for cleaner display
  const parts = displayName.split(', ');
  // Remove last parts that are typically country, postcode, region
  const filtered = parts.filter(
    (p) =>
      !/^\d{5,6}$/.test(p.trim()) &&
      p.trim() !== 'Россия' &&
      p.trim() !== 'Russia',
  );
  return filtered.join(', ');
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
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    color: colors.heading,
    ...typography.body,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
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
    maxHeight: 220,
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
    fontSize: 16,
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
