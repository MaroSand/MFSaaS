import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { productsService } from "../../../services/api/productsService";
import { useCategories } from "../../../hooks";
import { usePermissions } from "../../../hooks/usePermissions";
import { useCartStore } from "../../../store/cartStore";
import { IProduct } from "../../../types";

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { canViewCatalog } = usePermissions();
  const { categories } = useCategories(canViewCatalog);

  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await productsService.getProductById(productId, categories);
      setProduct(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "No se pudo cargar el producto.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId, categories]);

  useEffect(() => { if (canViewCatalog) loadProduct(); else router.replace('/(tabs)/orders' as any); }, [canViewCatalog, loadProduct, router]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7B1C1C" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || "Producto no encontrado"}</Text>
        {error && (
          <TouchableOpacity style={styles.addButton} onPress={loadProduct}>
            <Text style={styles.addButtonText}>Reintentar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const handleAddToCart = () => {
    addItem(product, qty);
    router.back(); // Volvemos al catálogo después de agregar
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.category}>{product.category.name}</Text>
          {!!product.sku && <Text style={styles.description}>Código: {product.sku}</Text>}
        <Text style={styles.description}>{product.description}</Text>

        <Text style={styles.price}>
          ${product.price.toLocaleString("es-AR")}{" "}
          <Text style={styles.unit}>x {product.unit}</Text>
        </Text>

        {/* Selector de cantidad simple */}
        <View style={styles.qtyContainer}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQty(Math.max(1, qty - 1))}
          >
            <Text style={styles.qtyButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>
            {qty} {product.unit}
          </Text>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQty(qty + 1)}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
          <Text style={styles.addButtonText}>Agregar al Pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 16,
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 3,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  category: {
    fontSize: 14,
    color: "#7B1C1C",
    fontWeight: "600",
    marginTop: 4,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 15,
    color: "#666666",
    marginTop: 12,
    lineHeight: 22,
  },
  price: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: 20,
  },
  unit: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "normal",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginVertical: 24,
  },
  qtyButton: {
    backgroundColor: "#F5E6E6",
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7B1C1C",
  },
  qtyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  addButton: {
    backgroundColor: "#7B1C1C",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#C62828",
    fontSize: 16,
  },
});
