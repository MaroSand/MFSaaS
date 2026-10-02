// src/app/(tabs)/catalog/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCategories } from "../../../hooks";
import { catalogService } from "../../../services/mock/catalogService";
import { useCartStore } from "../../../store/cartStore";
import { colors, radius, spacing, typography } from "../../../theme";
import { IProduct } from "../../../types/api.types";

export default function CatalogScreen() {
  const router = useRouter();

  // Categorías: conectadas al backend real (endpoint /category/get).
  // Se muestra el error real (en vez de confundirlo con "no hay categorías")
  // para poder reintentar sin perder el resto del filtro.
  const {
    categories,
    loading: loadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories();

  // Estados de datos y UI del listado de productos (mock: sin endpoint aún)
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscador de productos (reactivo, con debounce)
  const [search, setSearch] = useState("");

  // Filtro de categorías: se aplica directo al tocar un chip, sin modal
  // intermedio ni paso de "aplicar" (multi-selección simple).
  const [appliedCategoryIds, setAppliedCategoryIds] = useState<string[]>([]);

  const itemCount = useCartStore((state) => state.itemCount());
  const totalCart = useCartStore((state) => state.total());

  const activeFilterCount = appliedCategoryIds.length;

  // Cargar productos cada vez que cambia el buscador o el filtro aplicado
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await catalogService.getProducts(
          search,
          appliedCategoryIds,
        );
        setProducts(response.items);
      } catch (err: any) {
        setError(err.message || "Ocurrió un error al cargar el catálogo.");
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchCatalog();
    }, 300);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, appliedCategoryIds.join(",")]);

  function toggleCategory(categoryId: string) {
    setAppliedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }

  function clearAllFilters() {
    setAppliedCategoryIds([]);
  }

  // Renders de soporte para estados de UI
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setSearch("")}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con acceso a gestión de categorías */}
      <View style={styles.catalogHeader}>
        <Text style={styles.catalogHeaderTitle}>Catálogo</Text>
        <TouchableOpacity
          style={styles.manageCategoriesButton}
          onPress={() => router.push("/(tabs)/catalog/categories" as any)}
        >
          <Ionicons name="pricetags-outline" size={18} color={colors.primary} />
          <Text style={styles.manageCategoriesText}>Categorías</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto por nombre..."
          placeholderTextColor={colors.textDisabled}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Chips horizontales de categoría: única vía de filtrado */}
      <View style={styles.filterBar}>
        {loadingCategories ? (
          <ActivityIndicator color={colors.primary} style={{ marginRight: spacing.sm }} />
        ) : categoriesError ? (
          <TouchableOpacity onPress={refetchCategories} style={styles.chipsErrorContainer}>
            <Text style={styles.errorSectionText}>
              No se pudieron cargar las categorías. Toca para reintentar.
            </Text>
          </TouchableOpacity>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsScrollContent}
          >
            {categories.map((cat) => {
              const active = appliedCategoryIds.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => toggleCategory(cat.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[styles.categoryText, active && styles.categoryTextActive]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearLink}>
            <Text style={styles.clearLinkText}>
              Limpiar{activeFilterCount > 1 ? ` (${activeFilterCount})` : ""}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contador de resultados */}
      {!loading && (
        <Text style={styles.resultsCount}>
          {products.length} {products.length === 1 ? "producto" : "productos"}{" "}
          encontrado{products.length === 1 ? "" : "s"}
        </Text>
      )}

      {/* Listado Principal */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando catálogo...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            itemCount > 0 && { paddingBottom: 90 },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No se encontraron productos disponibles.
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={clearAllFilters} style={{ marginTop: spacing.md }}>
                  <Text style={styles.clearLinkText}>Limpiar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isLowStock = item.stock > 0 && item.stock <= item.minStock;
            const isOutOfStock = item.stock <= 0;
            return (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/catalog/[productId]" as any,
                    params: { productId: item.id },
                  })
                }
              >
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.stockBadgeContainer}>
                    <Text
                      style={[
                        styles.stockText,
                        isOutOfStock
                          ? styles.stockOut
                          : isLowStock
                          ? styles.stockWarning
                          : styles.stockOk,
                      ]}
                    >
                      {isOutOfStock
                        ? "Sin stock"
                        : `Stock: ${item.stock} ${item.unit}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.productPriceContainer}>
                  <Text style={styles.productPrice}>
                    ${item.price.toLocaleString("es-AR")}
                  </Text>
                  <Text style={styles.priceUnit}>x {item.unit}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* BOTÓN FLOTANTE DEL CARRITO (Aparece solo si hay ítems) */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.cartFloatingButton}
          onPress={() => router.push("/(tabs)/orders" as any)}
        >
          <View style={styles.cartFloatingLeft}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
            <Text style={styles.cartFloatingText}>Ver pedido actual</Text>
          </View>
          <Text style={styles.cartFloatingTotal}>
            ${totalCart.toLocaleString("es-AR")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  catalogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.surface,
  },
  catalogHeaderTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  manageCategoriesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  manageCategoriesText: {
    color: colors.primary,
    ...typography.caption,
    fontWeight: "600",
  },
  searchContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    height: 45,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  chipsScroll: {
    flex: 1,
  },
  chipsScrollContent: {
    gap: spacing.sm,
    alignItems: "center",
  },
  chipsErrorContainer: {
    flex: 1,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    color: colors.primary,
    ...typography.caption,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: colors.textInverse,
  },
  clearLink: {
    paddingHorizontal: spacing.xs,
  },
  clearLinkText: {
    color: colors.error,
    ...typography.caption,
    fontWeight: "600",
  },
  resultsCount: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 15,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  productInfo: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  productName: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  stockBadgeContainer: {
    alignSelf: "flex-start",
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600",
  },
  stockOk: {
    color: colors.success,
  },
  stockWarning: {
    color: colors.warning,
  },
  stockOut: {
    color: colors.error,
  },
  productPriceContainer: {
    alignItems: "flex-end",
  },
  productPrice: {
    ...typography.price,
    color: colors.primary,
  },
  priceUnit: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  errorSectionText: {
    ...typography.caption,
    color: colors.error,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  retryButtonText: {
    color: colors.textInverse,
    fontWeight: "bold",
  },
  cartFloatingButton: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cartFloatingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  cartFloatingText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  cartFloatingTotal: {
    color: colors.textInverse,
    fontSize: 18,
    fontWeight: "bold",
  },
});