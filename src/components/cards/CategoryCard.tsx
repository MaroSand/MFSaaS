import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { ICategory } from '../../types';

interface CategoryCardProps {
  category: ICategory;
  parentName?: string;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleActive?: (nextValue: boolean) => void;
  togglingActive?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  parentName,
  onPress,
  onLongPress,
  onToggleActive,
  togglingActive,
}) => {
  const isInactive = category.active === false;

  return (
    <TouchableOpacity
      style={[styles.container, isInactive && styles.containerInactive]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, isInactive && styles.nameInactive]} numberOfLines={1}>
            {category.name}
          </Text>
          {isInactive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactiva</Text>
            </View>
          )}
        </View>
        {parentName ? (
          <Text style={styles.parent} numberOfLines={1}>
            Subcategoría de {parentName}
          </Text>
        ) : (
          <Text style={styles.parent}>Categoría principal</Text>
        )}
      </View>

      {/* Toggle rápido de activo/inactivo, sin depender del long-press */}
      {onToggleActive &&
        (togglingActive ? (
          <ActivityIndicator color={colors.primary} style={styles.toggleSpace} />
        ) : (
          <Switch
            value={!isInactive}
            onValueChange={onToggleActive}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={!isInactive ? colors.primary : colors.textDisabled}
            style={styles.toggleSpace}
          />
        ))}

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
  containerInactive: {
    backgroundColor: colors.background,
    opacity: 0.75,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  nameInactive: {
    color: colors.textSecondary,
  },
  parent: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggleSpace: {
    marginRight: spacing.xs,
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