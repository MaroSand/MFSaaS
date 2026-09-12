import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { ICategory } from '../../types';

interface CategoryCardProps {
  category: ICategory;
  parentName?: string;
  onPress: () => void;
  onLongPress?: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  parentName,
  onPress,
  onLongPress,
}) => {
  const isInactive = category.active === false;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {category.name}
        </Text>
        {parentName ? (
          <Text style={styles.parent} numberOfLines={1}>
            Subcategoría de {parentName}
          </Text>
        ) : (
          <Text style={styles.parent}>Categoría principal</Text>
        )}
      </View>
      {isInactive && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveBadgeText}>Inactiva</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  parent: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inactiveBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  inactiveBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});