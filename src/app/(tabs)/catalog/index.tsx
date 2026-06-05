// src/app/(tabs)/catalog/index.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { catalogService } from "../../../services/mock/catalogService";
import { useCartStore } from "../../../store/cartStore";
import { ICategory, IProduct } from "../../../types/api.types";

export default function CatalogScreen() {
  const router = useRouter();

  // Estados de datos y UI
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  //
  const itemCount = useCartStore((state) => state.itemCount());
  const totalCart = useCartStore((state) => state.total());
  const addItem = useCartStore((state) => state.addItem);

  // Cargar categorías al iniciar
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const cats = await catalogService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Error cargando categorías", err);
      }
    };
    loadFilters();
  }, []);

  // Cargar productos cada vez que cambia el buscador o la categoría
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await catalogService.getProducts(
          search,
          selectedCategory,
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
  }, [search, selectedCategory]);

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
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto por nombre..."
          placeholderTextColor="#666666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Selector de Categorías */}
      <View style={styles.categoriesContainer}>
        {/* ... (tu código actual de categorías) ... */}
      </View>

      {/* Listado Principal */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7B1C1C" />
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
            </View>
          }
          renderItem={({ item }) => (
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
                      item.stock <= item.minStock
                        ? styles.stockWarning
                        : styles.stockOk,
                    ]}
                  >
                    Stock: {item.stock} {item.unit}
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
          )}
        />
      )}

      {/* BOTÓN FLOTANTE DEL CARRITO (Aparece solo si hay ítems) */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.cartFloatingButton}
          onPress={() => router.push("/(tabs)/orders" as any)} // Te manda a la pestaña de pedidos para cerrar la venta
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
    backgroundColor: "#F8F8F8", // colors.background
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchInput: {
    height: 45,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  categoriesContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5E6E6", // colors.primaryLight
  },
  categoryChipActive: {
    backgroundColor: "#7B1C1C", // colors.primary
  },
  categoryText: {
    color: "#7B1C1C",
    fontSize: 13,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666666",
    fontSize: 15,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  productInfo: {
    flex: 1,
    paddingRight: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 8,
  },
  stockBadgeContainer: {
    alignSelf: "flex-start",
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600",
  },
  stockOk: {
    color: "#2E7D32", // colors.success
  },
  stockWarning: {
    color: "#F57C00", // colors.warning
  },
  productPriceContainer: {
    alignItems: "flex-end",
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7B1C1C",
  },
  priceUnit: {
    fontSize: 12,
    color: "#666666",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#666666",
    fontSize: 15,
  },
  errorText: {
    color: "#C62828",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#7B1C1C",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  cartFloatingButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#7B1C1C", // Rojo Brand oficial
    borderRadius: 12,
    padding: 16,
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
    gap: 10,
  },
  badge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#7B1C1C",
    fontWeight: "bold",
    fontSize: 14,
  },
  cartFloatingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cartFloatingTotal: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
