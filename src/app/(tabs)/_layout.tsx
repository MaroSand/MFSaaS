import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { usePermissions } from "../../hooks";
import { colors } from "../../theme";

export default function TabsLayout() {
  const { canViewClients } = usePermissions();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="catalog/index"
        options={{
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
        name="orders/index"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients/index"
        options={{
          title: "Clientes",
          href: canViewClients ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
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
      <Tabs.Screen
        name="logistics/index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="reports/index"
        options={{ href: null }}
      />
    </Tabs>
  );
}
