import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClientCard } from '../../../components/cards';
import { useClients } from '../../../hooks';
import { colors, radius, spacing, typography } from '../../../theme';
import { IClient } from '../../../types';

const DEBOUNCE_DELAY = 400;

export default function ClientsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clients, loading, error, refetch, search, setSearch } = useClients();
  const [filteredSearch, setFilteredSearch] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  const handleSearchChange = (text: string) => {
    setFilteredSearch(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(text);
    }, DEBOUNCE_DELAY);
  };

  const handleClientPress = (client: IClient) => {
    router.push({
      pathname: '/(tabs)/clients/[clientId]',
      params: { clientId: client.id },
    });
  };

  const handleCreateClient = () => {
    router.push('/(tabs)/clients/form');
  };

  const handleViewDebtors = () => {
    router.push('/(tabs)/clients/debtors');
  };

  const renderClient = ({ item }: { item: IClient }) => (
    <ClientCard
      client={item}
      onPress={() => handleClientPress(item)}
      showDebtBadge
    />
  );

  const renderListEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando clientes...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Error al cargar clientes</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="folder-open" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>No hay clientes registrados</Text>
        <Text style={styles.emptyMessage}>
          Toca el botón + para crear un nuevo cliente o usa "Deudores" para ver saldos pendientes.
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clientes</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Module actions */}
      <View style={styles.moduleTabsContainer}>
        <View style={[styles.moduleTabButton, styles.moduleTabButtonActive]}>
          <Text style={[styles.moduleTabText, styles.moduleTabTextActive]}>
            Clientes
          </Text>
        </View>
        <TouchableOpacity
          style={styles.moduleTabButton}
          onPress={handleViewDebtors}
          activeOpacity={0.7}
        >
          <Text style={styles.moduleTabText}>Deudores</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o CUIT"
          placeholderTextColor={colors.textSecondary}
          value={filteredSearch}
          onChangeText={handleSearchChange}
          editable={!loading}
        />
        {filteredSearch.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setFilteredSearch('');
              setSearch('');
            }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Client List */}
      {clients.length > 0 ? (
        <FlashList
          data={clients}
          renderItem={renderClient}
          keyExtractor={(item) => item.id}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        renderListEmpty()
      )}

      {/* FAB - Create Client */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={handleCreateClient}
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
  moduleTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  moduleTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moduleTabButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  moduleTabText: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  moduleTabTextActive: {
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
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
  listContent: {
    paddingBottom: spacing.xl + spacing.lg,
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
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
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
