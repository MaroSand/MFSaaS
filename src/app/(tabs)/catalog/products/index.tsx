import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '../../../../hooks';
import { usePermissions } from '../../../../hooks/usePermissions';
import { productsService } from '../../../../services/api/productsService';
import { colors, radius, spacing, typography } from '../../../../theme';
import { IProduct } from '../../../../types';

export default function ProductManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { canManageProducts, canViewCatalog } = usePermissions();
  useEffect(() => { if (!canViewCatalog) router.replace('/(tabs)/orders' as any); }, [canViewCatalog, router]);
  const { categories } = useCategories(canViewCatalog);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsService.getProducts('', [], categories);
      setProducts(result.items);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }, [categories]);

  useFocusEffect(useCallback(() => { loadProducts(); }, [loadProducts]));

  const toggleActive = (product: IProduct) => {
    const activating = !product.active;
    Alert.alert(
      activating ? 'Activar producto' : 'Desactivar producto',
      '¿Querés ' + (activating ? 'activar' : 'desactivar') + ' "' + product.name + '"?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setBusyId(product.id);
            try {
              if (activating) await productsService.activateProduct(product.id);
              else await productsService.deactivateProduct(product.id);
              await loadProducts();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'No se pudo cambiar el estado del producto.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  const deleteProduct = (product: IProduct) => {
    Alert.alert('Eliminar producto', '¿Eliminar "' + product.name + '"? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setBusyId(product.id);
          try {
            await productsService.deleteProduct(product.id);
            await loadProducts();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'No se pudo eliminar el producto.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: IProduct }) => (
    <View style={styles.card}>
      <TouchableOpacity style={styles.mainInfo} onPress={() => canManageProducts && router.push({
        pathname: '/(tabs)/catalog/products/form' as any,
        params: { productId: item.id },
      })}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{item.category.name} · {'$' + item.price.toLocaleString('es-AR')}</Text>
        {!!item.sku && <Text style={styles.sku}>SKU: {item.sku}</Text>}
      </TouchableOpacity>
      {canManageProducts && <View style={styles.actions}>
        {busyId === item.id ? <ActivityIndicator color={colors.primary} /> : (
          <>
            <TouchableOpacity accessibilityLabel={item.active ? 'Desactivar' : 'Activar'} onPress={() => toggleActive(item)}>
              <Ionicons name={item.active ? 'eye-outline' : 'eye-off-outline'} size={22} color={item.active ? colors.success : colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel="Eliminar" onPress={() => deleteProduct(item)}>
              <Ionicons name="trash-outline" size={21} color={colors.error} />
            </TouchableOpacity>
          </>
        )}
      </View>}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Productos</Text>
        <View style={{ width: 24 }} />
      </View>
      {error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.error} />
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={loadProducts}><Text style={styles.retryText}>Reintentar</Text></TouchableOpacity>
        </View>
      ) : loading && products.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.helper}>Cargando productos…</Text></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={products.length ? styles.list : styles.center}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProducts} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={styles.helper}>Todavía no hay productos.</Text>}
        />
      )}
      {canManageProducts && <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + spacing.lg }]} onPress={() => router.push('/(tabs)/catalog/products/form' as any)}>
        <Ionicons name="add" size={25} color={colors.textInverse} />
      </TouchableOpacity>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.heading, color: colors.textPrimary },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, marginBottom: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  mainInfo: { flex: 1 },
  name: { ...typography.subheading, color: colors.textPrimary },
  meta: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  sku: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingLeft: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  helper: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
  error: { ...typography.body, color: colors.error, marginTop: spacing.md, textAlign: 'center' },
  retry: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  retryText: { ...typography.label, color: colors.textInverse },
  fab: { position: 'absolute', right: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});
