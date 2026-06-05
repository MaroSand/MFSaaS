import { Tabs } from 'expo-router';
import { usePermissions } from '../../hooks';
import { colors } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const { canViewClients, canViewLogistics, canViewReports } = usePermissions();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen
        name="catalog/index"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients/index"
        options={{
          title: 'Clientes',
          href: canViewClients ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logistics/index"
        options={{
          title: 'Mi Camión',
          href: canViewLogistics ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports/index"
        options={{
          title: 'Reportes',
          href: canViewReports ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}