import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from './Input';
import { colors, spacing } from '../theme';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilter?: () => void;
  filterActive?: boolean;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Поиск...',
  onFilter,
  filterActive = false,
}: SearchInputProps) {
  const searchIcon = (
    <Ionicons name="search-outline" size={18} color={colors.textLight} />
  );

  const filterButton = onFilter ? (
    <Pressable onPress={onFilter} style={styles.filterButton} hitSlop={8}>
      <View style={styles.filterIconContainer}>
        <Ionicons name="options-outline" size={20} color={colors.textLight} />
        {filterActive && <View style={styles.filterDot} />}
      </View>
    </Pressable>
  ) : (
    <Ionicons name="search-outline" size={18} color={colors.textLight} />
  );

  return (
    <Input
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      leftIcon={onFilter ? searchIcon : undefined}
      rightIcon={filterButton}
      clearable
    />
  );
}

const styles = StyleSheet.create({
  filterButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  filterIconContainer: {
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
