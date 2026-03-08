import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

// Reset web outline on focused inputs
const webInputReset = Platform.OS === 'web'
  ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
  : {};
import { RUSSIAN_CITIES } from '../data/cities';

interface CityPickerProps {
  value: string;
  onSelect: (city: string) => void;
  placeholder?: string;
  error?: string;
}

const MAX_SUGGESTIONS = 6;

export function CityPicker({
  value,
  onSelect,
  placeholder = 'Город',
  error,
}: CityPickerProps) {
  const [query, setQuery] = useState(value);
  const [focused, setFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const suggestions = useMemo(() => {
    if (!query.trim() || query === value) return [];
    const q = query.toLowerCase().trim();
    return RUSSIAN_CITIES.filter((city) =>
      city.toLowerCase().startsWith(q),
    ).slice(0, MAX_SUGGESTIONS);
  }, [query, value]);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    setShowDropdown(true);
  }, []);

  const handleSelect = useCallback(
    (city: string) => {
      setQuery(city);
      setShowDropdown(false);
      onSelect(city);
      Keyboard.dismiss();
    },
    [onSelect],
  );

  const handleFocus = useCallback(() => {
    setFocused(true);
    if (query.trim() && query !== value) {
      setShowDropdown(true);
    }
  }, [query, value]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    // Delay hiding dropdown so tap on suggestion registers
    setTimeout(() => setShowDropdown(false), 200);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    onSelect('');
    inputRef.current?.focus();
  }, [onSelect]);

  const showSuggestions = showDropdown && suggestions.length > 0;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          error ? styles.inputRowError : undefined,
        ]}
      >
        <View style={styles.leftIcon}>
          <Ionicons name="location-outline" size={18} color={colors.textLight} />
        </View>
        <TextInput
          ref={inputRef}
          style={[styles.input, webInputReset]}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton} hitSlop={8}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Dropdown suggestions */}
      {showSuggestions && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={suggestions.length > 4}
            style={suggestions.length > 4 ? { maxHeight: 220 } : undefined}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  pressed && styles.suggestionPressed,
                  index === 0 && styles.suggestionFirst,
                  index === suggestions.length - 1 && styles.suggestionLast,
                ]}
              >
                <Ionicons
                  name="location"
                  size={16}
                  color={colors.primary}
                  style={styles.suggestionIcon}
                />
                <Text style={styles.suggestionText}>
                  <Text style={styles.suggestionMatch}>
                    {item.slice(0, query.length)}
                  </Text>
                  {item.slice(query.length)}
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

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    zIndex: 100,
    elevation: 100,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    borderWidth: 0,
  },
  inputRowFocused: {
    // No border on focus — clean look
  },
  inputRowError: {
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  leftIcon: {
    paddingLeft: spacing.lg,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    color: colors.heading,
    ...typography.body,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: 16,
    color: colors.textLight,
    fontWeight: '300',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 100,
    zIndex: 100,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionFirst: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  suggestionLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  suggestionPressed: {
    backgroundColor: colors.primaryLight,
  },
  suggestionIcon: {
    marginRight: spacing.md,
  },
  suggestionText: {
    ...typography.body,
    color: colors.heading,
    flex: 1,
  },
  suggestionMatch: {
    fontWeight: '700',
    color: colors.primary,
  },
  error: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
