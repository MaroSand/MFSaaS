import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../theme";
import { usePermissions } from "../../hooks/usePermissions";

export default function TabsLayout() {
  const permissions = usePermissions();
  const hidden: { href: null } = { href: null };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarItemStyle: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="catalog/index"
        options={{
          ...(permissions.canViewCatalog ? {} : hidden),
          title: "Catálogo",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 🛠️ AGREGAMOS ESTA PANTALLA ACÁ PARA OCULTAR EL BOTÓN FANTASMA DE LA BARRA INFERIOR */}
      <Tabs.Screen
        name="catalog/[productId]"
        options={{
          href: null, // Esto lo remueve por completo del menú de pestañas
        }}
      />

      <Tabs.Screen
        name="catalog/categories/index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="catalog/categories/form"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="catalog/products/index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="catalog/products/form"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="orders/index"
        options={{
          ...(permissions.canViewOrders ? {} : hidden),
          title: "Pedidos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="logistics/index"
        options={{
          ...(permissions.canViewLogistics ? {} : hidden),
          title: "Camiones",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bus-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients/index"
        options={{
          ...(permissions.canViewClients ? {} : hidden),
          title: "Clientes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* "profile" es una sola entrada: tiene su propio _layout.tsx (Stack) adentro,
          así que edit/about viven ahí y no aparecen como tabs sueltas */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="clients/[clientId]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="clients/form"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="clients/debtors"
        options={{ href: null }}
      />
      <Tabs.Screen name="clients/ledger" options={{ href: null }} />
      <Tabs.Screen name="users/index" options={{ href: null }} />
      <Tabs.Screen
        name="reports/index"
        options={{ href: null }}
      />
    </Tabs>
  );
}
