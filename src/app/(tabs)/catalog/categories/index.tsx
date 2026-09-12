import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryCard } from '../../../../components/cards';
import { useCategories } from '../../../../hooks';
import { catalogService } from '../../../../services/api/catalogService';
import { colors, radius, spacing, typography } from '../../../../theme';
import { ICategory } from '../../../../types';

export default function CategoriesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories, loading, error, refetch, search, setSearch } = useCategories();
  const [busyId, setBusyId] = useState<string | null>(null);

  const parentNameOf = (category: ICategory) =>
    category.parentCategoryId
      ? categories.find(c => c.id === category.parentCategoryId)?.name
      : undefined;

  const handleCreate = () => {
    router.push('/(tabs)/catalog/categories/form' as any);
  };

  const handleEdit = (category: ICategory) => {
    router.push({
      pathname: '/(tabs)/catalog/categories/form' as any,
      params: { categoryId: category.id },
    });
  };

  const handleToggleActive = (category: ICategory) => {
    const willDeactivate = category.active !== false;
    Alert.alert(
      willDeactivate ? 'Desactivar categoría' : 'Activar categoría',
      `¿Confirmás ${willDeactivate ? 'desactivar' : 'activar'} "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setBusyId(category.id);
              if (willDeactivate) {
                await catalogService.deactivateCategory(category.id);
              } else {
                await catalogService.activateCategory(category.id);
              }
              await refetch();
            } catch (err) {
              Alert.alert('Error', 'No se pudo actualizar el estado de la categoría');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (category: ICategory) => {
    Alert.alert(
      'Eliminar categoría',
      `Esta acción no se puede deshacer. ¿Eliminar "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusyId(category.id);
              await catalogService.deleteCategory(category.id);
              await refetch();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar la categoría');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const handleLongPress = (category: ICategory) => {
    Alert.alert(category.name, 'Elegí una acción', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Editar', onPress: () => handleEdit(category) },
      {
        text: category.active === false ? 'Activar' : 'Desactivar',
        onPress: () => handleToggleActive(category),
      },
      { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(category) },
    ]);
  };

  const renderCategory = ({ item }: { item: ICategory }) => (
    <View>
      {busyId === item.id ? (
        <View style={styles.busyOverlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
      <CategoryCard
        category={item}
        parentName={parentNameOf(item)}
        onPress={() => handleEdit(item)}
        onLongPress={() => handleLongPress(item)}
      />
    </View>
  );

  const renderListEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando categorías...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Error al cargar categorías</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="folder-open" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>No hay categorías creadas</Text>
        <Text style={styles.emptyMessage}>Tocá el botón + para crear la primera.</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categorías</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar categoría"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          editable={!loading}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.hint}>Mantené presionada una categoría para más acciones</Text>

      {/* List */}
      {categories.length > 0 ? (
        <FlashList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          extraData={busyId}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />
          }
        />
      ) : (
        renderListEmpty()
      )}

      {/* FAB - Create Category */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={handleCreate}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl + spacing.lg,
    paddingTop: spacing.sm,
  },
  busyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorTitle: {
    ...typography.subheading,
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryButtonText: {
    ...typography.label,
    color: colors.textInverse,
    fontWeight: '600',
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});