// src/app/(tabs)/catalog/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../../components/ui";
import { useCategories } from "../../../hooks";
import {
  catalogService,
  StockFilterValue,
} from "../../../services/mock/catalogService";
import { useCartStore } from "../../../store/cartStore";
import { colors, radius, spacing, typography } from "../../../theme";
import { IProduct } from "../../../types/api.types";

const STOCK_FILTER_OPTIONS: { value: StockFilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "in_stock", label: "En stock" },
  { value: "low_stock", label: "Stock bajo" },
  { value: "out_of_stock", label: "Sin stock" },
];

export default function CatalogScreen() {
  const router = useRouter();

  // Categorías: ya conectadas al backend real (endpoint /category/get)
  const {
    categories,
    loading: loadingCategories,
    search: categorySearch,
    setSearch: setCategorySearch,
  } = useCategories();

  // Estados de datos y UI del listado de productos (mock: sin endpoint aún)
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscador de productos (reactivo, con debounce)
  const [search, setSearch] = useState("");

  // Filtros aplicados (los que realmente se usan para pedir productos)
  const [appliedCategoryIds, setAppliedCategoryIds] = useState<string[]>([]);
  const [appliedStockFilter, setAppliedStockFilter] =
    useState<StockFilterValue>("all");

  // Filtros "borrador" dentro del modal: se confirman recién al tocar "Aplicar"
  // (útil para no disparar una consulta pesada al backend por cada tap)
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>([]);
  const [draftStockFilter, setDraftStockFilter] =
    useState<StockFilterValue>("all");

  const itemCount = useCartStore((state) => state.itemCount());
  const totalCart = useCartStore((state) => state.total());

  const activeFilterCount =
    appliedCategoryIds.length + (appliedStockFilter !== "all" ? 1 : 0);

  // Cargar productos cada vez que cambia el buscador o los filtros aplicados
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await catalogService.getProducts(
          search,
          appliedCategoryIds,
          appliedStockFilter,
        );
        setProducts(response.items);
      } catch (err: any) {
        setError(err.message || "Ocurrió un error al cargar el catálogo.");
      } finally {
        setLoading(false);
      }
    };

    // Un pequeño debounce nativo para no re-ejecutar en cada letra del buscador
    const delayDebounce = setTimeout(() => {
      fetchCatalog();
    }, 300);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, appliedCategoryIds.join(","), appliedStockFilter]);

  function toggleQuickCategory(categoryId: string) {
    setAppliedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }

  function openFilterModal() {
    setDraftCategoryIds(appliedCategoryIds);
    setDraftStockFilter(appliedStockFilter);
    setFilterModalVisible(true);
  }

  function toggleDraftCategory(categoryId: string) {
    setDraftCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }

  function applyDraftFilters() {
    setAppliedCategoryIds(draftCategoryIds);
    setAppliedStockFilter(draftStockFilter);
    setFilterModalVisible(false);
  }

  function clearDraftFilters() {
    setDraftCategoryIds([]);
    setDraftStockFilter("all");
  }

  function clearAllFilters() {
    setAppliedCategoryIds([]);
    setAppliedStockFilter("all");
  }

  const draftFilterCount = useMemo(
    () => draftCategoryIds.length + (draftStockFilter !== "all" ? 1 : 0),
    [draftCategoryIds, draftStockFilter],
  );

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

      {/* Barra de filtros: botón "Filtros" + chips rápidos de categoría + limpiar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive,
          ]}
          onPress={openFilterModal}
          accessibilityRole="button"
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={activeFilterCount > 0 ? colors.textInverse : colors.primary}
          />
          <Text
            style={[
              styles.filterButtonText,
              activeFilterCount > 0 && styles.filterButtonTextActive,
            ]}
          >
            Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Text>
        </TouchableOpacity>

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
                onPress={() => toggleQuickCategory(cat.id)}
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

        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearLink}>
            <Text style={styles.clearLinkText}>Limpiar</Text>
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

      {/* MODAL DE FILTROS AVANZADOS */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Sección Categorías (multi-selección) */}
              <Text style={styles.sectionLabel}>Categorías</Text>
              {categories.length > 6 && (
                <TextInput
                  style={styles.categorySearchInput}
                  placeholder="Buscar categoría..."
                  placeholderTextColor={colors.textDisabled}
                  value={categorySearch}
                  onChangeText={setCategorySearch}
                />
              )}
              {loadingCategories ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
              ) : categories.length === 0 ? (
                <Text style={styles.emptySectionText}>No hay categorías cargadas.</Text>
              ) : (
                categories.map((cat) => {
                  const checked = draftCategoryIds.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.optionRow}
                      onPress={() => toggleDraftCategory(cat.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                    >
                      <Ionicons
                        name={checked ? "checkbox" : "square-outline"}
                        size={22}
                        color={checked ? colors.primary : colors.textDisabled}
                      />
                      <Text style={styles.optionLabel}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Sección Stock (selección única) */}
              <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
                Disponibilidad de stock
              </Text>
              {STOCK_FILTER_OPTIONS.map((opt) => {
                const selected = draftStockFilter === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.optionRow}
                    onPress={() => setDraftStockFilter(opt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name={selected ? "radio-button-on" : "radio-button-off"}
                      size={22}
                      color={selected ? colors.primary : colors.textDisabled}
                    />
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Footer: Limpiar / Aplicar */}
            <View style={styles.modalFooter}>
              <Button
                label="Limpiar"
                variant="outline"
                onPress={clearDraftFilters}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                label={
                  draftFilterCount > 0
                    ? `Aplicar filtros (${draftFilterCount})`
                    : "Aplicar filtros"
                }
                variant="primary"
                onPress={applyDraftFilters}
                style={{ flex: 1.4 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    color: colors.primary,
    ...typography.caption,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: colors.textInverse,
  },
  chipsScroll: {
    flex: 1,
  },
  chipsScrollContent: {
    gap: spacing.sm,
    alignItems: "center",
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
  // ─── Modal de filtros ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: "80%",
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  modalBody: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  categorySearchInput: {
    height: 40,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySectionText: {
    ...typography.caption,
    color: colors.textDisabled,
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  modalFooter: {
    flexDirection: "row",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});