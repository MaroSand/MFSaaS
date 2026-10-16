import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FormErrorBanner } from '../../../components/ui/FormErrorBanner';
import { logisticsService, Truck, TruckStockItem } from '../../../services/api/logisticsService';
import { productsService } from '../../../services/api/productsService';
import { IProduct } from '../../../types';
import { colors, radius, spacing, typography } from '../../../theme';
import { parseApiError } from '../../../utils/apiErrors';

type DeleteTarget = { kind: 'truck' | 'stock'; id: string; label: string } | null;

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function LogisticsScreen() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [stock, setStock] = useState<TruckStockItem[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loadingTrucks, setLoadingTrucks] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truckModal, setTruckModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [plate, setPlate] = useState('');
  const [driverId, setDriverId] = useState('');
  const [addStockModal, setAddStockModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityToLoad, setQuantityToLoad] = useState('');
  const [stockDate, setStockDate] = useState(today());
  const [editingStock, setEditingStock] = useState<TruckStockItem | null>(null);
  const [editLoaded, setEditLoaded] = useState('');
  const [editReturned, setEditReturned] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const loadTrucks = useCallback(async () => {
    setLoadingTrucks(true);
    setError(null);
    try {
      const result = await logisticsService.getTrucks();
      setTrucks(result);
      setSelectedTruck(current => current ? result.find(truck => truck.id === current.id) ?? null : null);
    } catch (err) {
      setError(parseApiError(err, 'No se pudieron cargar los camiones.').message);
    } finally {
      setLoadingTrucks(false);
    }
  }, []);

  const loadStock = useCallback(async (truck: Truck, date?: string) => {
    setSelectedTruck(truck);
    setLoadingStock(true);
    setError(null);
    try {
      setStock(await logisticsService.getTruckStock(truck.id, date));
    } catch (err) {
      setError(parseApiError(err, 'No se pudo consultar el stock del camión.').message);
      setStock([]);
    } finally {
      setLoadingStock(false);
    }
  }, []);

  useEffect(() => { void loadTrucks(); }, [loadTrucks]);

  const openTruckForm = (truck?: Truck) => {
    setEditingTruck(truck ?? null);
    setPlate(truck?.licensePlate ?? '');
    setDriverId(truck?.driverId ?? '');
    setError(null);
    setTruckModal(true);
  };

  const saveTruck = async () => {
    const normalizedPlate = plate.trim().toUpperCase();
    if (!normalizedPlate) { setError('Ingresá la patente del camión.'); return; }
    if (normalizedPlate.length > 20) { setError('La patente no puede superar 20 caracteres.'); return; }
    const normalizedDriverId = driverId.trim();
    if (normalizedDriverId && (!/^\d+$/.test(normalizedDriverId) || Number(normalizedDriverId) < 1)) {
      setError('El ID del chofer debe ser un número entero positivo.'); return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { licensePlate: normalizedPlate, ...(normalizedDriverId ? { driverId: Number(normalizedDriverId) } : {}) };
      if (editingTruck) await logisticsService.updateTruck(editingTruck.id, payload);
      else await logisticsService.createTruck(payload);
      setTruckModal(false);
      await loadTrucks();
    } catch (err) {
      setError(parseApiError(err, 'No se pudo guardar el camión.').message);
    } finally { setSaving(false); }
  };

  const toggleTruck = async (truck: Truck) => {
    setSaving(true);
    setError(null);
    try {
      if (truck.active) await logisticsService.deactivateTruck(truck.id);
      else await logisticsService.activateTruck(truck.id);
      await loadTrucks();
    } catch (err) {
      setError(parseApiError(err, 'No se pudo cambiar el estado del camión.').message);
    } finally { setSaving(false); }
  };

  const openAddStock = async () => {
    if (!selectedTruck) return;
    setError(null);
    setAddStockModal(true);
    setLoadingProducts(true);
    try {
      const result = await productsService.getProducts();
      setProducts(result.items.filter(product => product.active));
    } catch (err) {
      setError(parseApiError(err, 'No se pudieron cargar los productos.').message);
    } finally { setLoadingProducts(false); }
  };

  const addStock = async () => {
    if (!selectedTruck || !selectedProductId) { setError('Seleccioná un producto.'); return; }
    const quantity = Number(quantityToLoad);
    if (!Number.isInteger(quantity) || quantity < 1) { setError('La cantidad a cargar debe ser un número entero mayor a cero.'); return; }
    const productId = Number(selectedProductId);
    if (!Number.isInteger(productId) || productId < 1) { setError('El producto seleccionado no tiene un ID válido del servidor.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(stockDate) || Number.isNaN(Date.parse(`${stockDate}T00:00:00`))) { setError('Ingresá una fecha válida con formato AAAA-MM-DD.'); return; }
    setSaving(true);
    setError(null);
    try {
      await logisticsService.loadProduct(selectedTruck.id, { productId, deliveryDate: stockDate, quantityLoaded: quantity });
      setAddStockModal(false);
      setQuantityToLoad('');
      setSelectedProductId('');
      await loadStock(selectedTruck, stockDate);
    } catch (err) {
      setError(parseApiError(err, 'No se pudo cargar el producto en el camión.').message);
    } finally { setSaving(false); }
  };

  const openEditStock = (item: TruckStockItem) => {
    setEditingStock(item);
    setEditLoaded(String(item.quantityLoaded));
    setEditReturned(String(item.quantityReturned));
    setError(null);
  };

  const saveStockEdit = async () => {
    if (!editingStock) return;
    const loaded = Number(editLoaded);
    const returned = Number(editReturned);
    if (!Number.isInteger(loaded) || loaded < 0 || !Number.isInteger(returned) || returned < 0 || returned > loaded) {
      setError('Usá cantidades enteras válidas; la devolución no puede superar lo cargado.'); return;
    }
    setSaving(true);
    setError(null);
    try {
      await logisticsService.updateStock(editingStock.id, { quantityLoaded: loaded, quantityReturned: returned });
      const truck = selectedTruck;
      setEditingStock(null);
      if (truck) await loadStock(truck, stockDate);
    } catch (err) {
      setError(parseApiError(err, 'No se pudo actualizar el stock.').message);
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      if (deleteTarget.kind === 'truck') {
        await logisticsService.deleteTruck(deleteTarget.id);
        if (selectedTruck?.id === deleteTarget.id) { setSelectedTruck(null); setStock([]); }
        await loadTrucks();
      } else {
        await logisticsService.deleteStock(deleteTarget.id);
        if (selectedTruck) await loadStock(selectedTruck, stockDate);
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteTarget(null);
      setError(parseApiError(err, 'No se pudo eliminar el registro.').message);
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>OPERACIONES</Text><Text style={styles.title}>Camiones y stock</Text><Text style={styles.subtitle}>Prepará la carga antes de salir a reparto.</Text></View>
        <View style={styles.headerIcon}><Ionicons name="bus-outline" size={24} color={colors.primary} /></View>
      </View>

      {!!error && <FormErrorBanner message={error} onRetry={() => selectedTruck ? loadStock(selectedTruck, stockDate) : loadTrucks()} />}

      <View style={styles.sectionHeader}>
        <View><Text style={styles.sectionTitle}>Flota</Text><Text style={styles.sectionHint}>{trucks.length} {trucks.length === 1 ? 'camión' : 'camiones'} registrados</Text></View>
        <TouchableOpacity style={styles.primarySmallButton} onPress={() => openTruckForm()}><Ionicons name="add" size={18} color={colors.textInverse} /><Text style={styles.primarySmallText}>Agregar</Text></TouchableOpacity>
      </View>

      {loadingTrucks ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : trucks.length ? trucks.map(truck => (
        <View key={truck.id} style={[styles.truckCard, selectedTruck?.id === truck.id && styles.truckCardSelected]}>
          <TouchableOpacity style={styles.truckMain} onPress={() => void loadStock(truck, stockDate)}>
            <View style={styles.truckIcon}><Ionicons name="bus" size={20} color={colors.primary} /></View>
            <View style={styles.truckInfo}><Text style={styles.plate}>{truck.licensePlate || 'Sin patente'}</Text><Text style={styles.driver}>{truck.driverName ?? (truck.driverId ? `Chofer ID ${truck.driverId}` : 'Sin chofer asignado')}</Text></View>
            <View style={[styles.activePill, !truck.active && styles.inactivePill]}><Text style={[styles.activeText, !truck.active && styles.inactiveText]}>{truck.active ? 'Activo' : 'Inactivo'}</Text></View>
            <Ionicons name={selectedTruck?.id === truck.id ? 'chevron-up' : 'chevron-down'} size={19} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.truckActions}>
            <TouchableOpacity style={styles.truckAction} onPress={() => openTruckForm(truck)}><Ionicons name="create-outline" size={16} color={colors.textSecondary} /><Text style={styles.truckActionText}>Editar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.truckAction} onPress={() => void toggleTruck(truck)} disabled={saving}><Ionicons name={truck.active ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={colors.textSecondary} /><Text style={styles.truckActionText}>{truck.active ? 'Desactivar' : 'Activar'}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.truckAction} onPress={() => setDeleteTarget({ kind: 'truck', id: truck.id, label: truck.licensePlate })}><Ionicons name="trash-outline" size={16} color={colors.error} /><Text style={[styles.truckActionText, { color: colors.error }]}>Eliminar</Text></TouchableOpacity>
          </View>
        </View>
      )) : <View style={styles.emptyCard}><Ionicons name="bus-outline" size={28} color={colors.textSecondary} /><Text style={styles.emptyTitle}>Todavía no hay camiones</Text><Text style={styles.emptyText}>Agregá un camión para gestionar su stock.</Text></View>}

      {selectedTruck && <View style={styles.stockSection}>
        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Stock de {selectedTruck.licensePlate}</Text><Text style={styles.sectionHint}>Cargado para la fecha seleccionada</Text></View>
          <TouchableOpacity style={styles.primarySmallButton} onPress={() => void openAddStock()}><Ionicons name="add" size={18} color={colors.textInverse} /><Text style={styles.primarySmallText}>Cargar</Text></TouchableOpacity>
        </View>
        <View style={styles.dateCard}><Ionicons name="calendar-outline" size={17} color={colors.primary} /><Text style={styles.dateCaption}>Fecha de reparto</Text><TextInput value={stockDate} onChangeText={setStockDate} style={styles.dateInput} placeholder="AAAA-MM-DD" maxLength={10} /></View>
        <TouchableOpacity style={styles.refreshStock} onPress={() => void loadStock(selectedTruck, stockDate)}><Ionicons name="refresh-outline" size={16} color={colors.primary} /><Text style={styles.refreshText}>Actualizar stock</Text></TouchableOpacity>
        {loadingStock ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : stock.length ? stock.map(item => (
          <View key={item.id} style={styles.stockCard}>
            <View style={styles.stockTop}><View style={styles.stockProductIcon}><Ionicons name="cube-outline" size={17} color={colors.primary} /></View><View style={styles.stockNameWrap}><Text style={styles.stockName}>{item.productName}</Text><Text style={styles.stockDate}>{item.deliveryDate || stockDate}</Text></View><TouchableOpacity onPress={() => openEditStock(item)} style={styles.iconButton}><Ionicons name="create-outline" size={18} color={colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => setDeleteTarget({ kind: 'stock', id: item.id, label: item.productName })} style={styles.iconButton}><Ionicons name="trash-outline" size={18} color={colors.error} /></TouchableOpacity></View>
            <View style={styles.stockStats}><Text style={styles.stockStat}>Cargado <Text style={styles.stockNumber}>{item.quantityLoaded}</Text></Text><Text style={styles.stockStat}>Devuelto <Text style={styles.stockNumber}>{item.quantityReturned}</Text></Text><Text style={styles.remainingStat}>Disponible <Text style={styles.remainingNumber}>{Math.max(0, item.quantityLoaded - item.quantityReturned)}</Text></Text></View>
          </View>
        )) : <View style={styles.emptyStock}><Text style={styles.emptyText}>No hay carga registrada para este camión y fecha.</Text></View>}
      </View>}

      <Modal visible={truckModal} transparent animationType="fade" onRequestClose={() => setTruckModal(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{editingTruck ? 'Editar camión' : 'Nuevo camión'}</Text>
          {!!error && <Text style={styles.modalError}>{error}</Text>}
          <Text style={styles.inputLabel}>Patente</Text><TextInput value={plate} onChangeText={setPlate} style={styles.input} placeholder="ABC 123" autoCapitalize="characters" maxLength={20} editable={!saving} />
          <Text style={styles.inputLabel}>ID del chofer <Text style={styles.optional}>(opcional)</Text></Text><TextInput value={driverId} onChangeText={setDriverId} style={styles.input} placeholder="ID de usuario REPARTIDOR" keyboardType="number-pad" editable={!saving} />
          <View style={styles.modalActions}><TouchableOpacity style={styles.secondaryButton} onPress={() => setTruckModal(false)} disabled={saving}><Text style={styles.secondaryButtonText}>Volver</Text></TouchableOpacity><TouchableOpacity style={styles.modalPrimaryButton} onPress={() => void saveTruck()} disabled={saving}>{saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.modalPrimaryText}>Guardar</Text>}</TouchableOpacity></View>
        </View></View>
      </Modal>

      <Modal visible={addStockModal} transparent animationType="fade" onRequestClose={() => setAddStockModal(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Cargar producto</Text>{!!error && <Text style={styles.modalError}>{error}</Text>}<Text style={styles.modalDescription}>Camión {selectedTruck?.licensePlate}</Text>
          <Text style={styles.inputLabel}>Fecha (AAAA-MM-DD)</Text><TextInput value={stockDate} onChangeText={setStockDate} style={styles.input} placeholder="2026-10-12" maxLength={10} editable={!saving} />
          <Text style={styles.inputLabel}>Producto</Text>
          {loadingProducts ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : <ScrollView style={styles.productPicker} nestedScrollEnabled>{products.map(product => <TouchableOpacity key={product.id} style={[styles.productChoice, selectedProductId === product.id && styles.productChoiceSelected]} onPress={() => setSelectedProductId(product.id)}><Text style={[styles.productChoiceText, selectedProductId === product.id && styles.productChoiceTextSelected]}>{product.name}</Text><Text style={styles.productUnit}>{product.unit}</Text></TouchableOpacity>)}</ScrollView>}
          <Text style={styles.inputLabel}>Cantidad</Text><TextInput value={quantityToLoad} onChangeText={setQuantityToLoad} style={styles.input} placeholder="0" keyboardType="number-pad" editable={!saving} />
          <View style={styles.modalActions}><TouchableOpacity style={styles.secondaryButton} onPress={() => setAddStockModal(false)} disabled={saving}><Text style={styles.secondaryButtonText}>Volver</Text></TouchableOpacity><TouchableOpacity style={styles.modalPrimaryButton} onPress={() => void addStock()} disabled={saving || loadingProducts}>{saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.modalPrimaryText}>Cargar</Text>}</TouchableOpacity></View>
        </View></View>
      </Modal>

      <Modal visible={!!editingStock} transparent animationType="fade" onRequestClose={() => setEditingStock(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Ajustar cantidades</Text>{!!error && <Text style={styles.modalError}>{error}</Text>}<Text style={styles.modalDescription}>{editingStock?.productName}</Text>
          <Text style={styles.inputLabel}>Cantidad cargada</Text><TextInput value={editLoaded} onChangeText={setEditLoaded} style={styles.input} keyboardType="number-pad" editable={!saving} />
          <Text style={styles.inputLabel}>Cantidad devuelta</Text><TextInput value={editReturned} onChangeText={setEditReturned} style={styles.input} keyboardType="number-pad" editable={!saving} />
          <View style={styles.modalActions}><TouchableOpacity style={styles.secondaryButton} onPress={() => setEditingStock(null)} disabled={saving}><Text style={styles.secondaryButtonText}>Volver</Text></TouchableOpacity><TouchableOpacity style={styles.modalPrimaryButton} onPress={() => void saveStockEdit()} disabled={saving}>{saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.modalPrimaryText}>Guardar</Text>}</TouchableOpacity></View>
        </View></View>
      </Modal>

      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={styles.deleteIcon}><Ionicons name="trash-outline" size={24} color={colors.error} /></View><Text style={styles.modalTitle}>Eliminar registro</Text><Text style={styles.modalDescription}>¿Querés eliminar {deleteTarget?.label}? Esta acción no se puede deshacer.</Text>
          <View style={styles.modalActions}><TouchableOpacity style={styles.secondaryButton} onPress={() => setDeleteTarget(null)} disabled={saving}><Text style={styles.secondaryButtonText}>Volver</Text></TouchableOpacity><TouchableOpacity style={styles.deleteButton} onPress={() => void confirmDelete()} disabled={saving}>{saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.modalPrimaryText}>Eliminar</Text>}</TouchableOpacity></View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  eyebrow: { ...typography.caption, color: colors.primary, fontWeight: '800', letterSpacing: 1.4 },
  title: { ...typography.heading, color: colors.textPrimary, marginTop: 3 },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  headerIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: spacing.sm },
  sectionTitle: { ...typography.subheading, color: colors.textPrimary },
  sectionHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  primarySmallButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  primarySmallText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' },
  loader: { paddingVertical: spacing.xl },
  truckCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden' },
  truckCardSelected: { borderColor: colors.primary },
  truckMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  truckIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primaryLight },
  truckInfo: { flex: 1 },
  plate: { ...typography.label, color: colors.textPrimary, fontWeight: '800' },
  driver: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  activePill: { backgroundColor: colors.successLight, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  inactivePill: { backgroundColor: colors.background },
  activeText: { ...typography.caption, color: colors.success, fontSize: 10, fontWeight: '700' },
  inactiveText: { color: colors.textSecondary },
  truckActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, justifyContent: 'flex-end', gap: spacing.md },
  truckAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs },
  truckActionText: { ...typography.caption, color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.xl },
  emptyTitle: { ...typography.label, color: colors.textPrimary, marginTop: spacing.sm },
  emptyText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  stockSection: { marginTop: spacing.md },
  dateCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginBottom: spacing.xs },
  dateCaption: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  dateInput: { ...typography.caption, color: colors.textPrimary, textAlign: 'right', minWidth: 110, paddingVertical: spacing.sm },
  refreshStock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs, paddingVertical: spacing.sm, marginBottom: spacing.xs },
  refreshText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  stockCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  stockTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stockProductIcon: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stockNameWrap: { flex: 1 },
  stockName: { ...typography.label, color: colors.textPrimary },
  stockDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  iconButton: { padding: spacing.xs },
  stockStats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  stockStat: { ...typography.caption, color: colors.textSecondary },
  stockNumber: { color: colors.textPrimary, fontWeight: '700' },
  remainingStat: { ...typography.caption, color: colors.primary, marginLeft: 'auto' },
  remainingNumber: { fontWeight: '800' },
  emptyStock: { padding: spacing.lg, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20, 12, 10, 0.48)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: { width: '100%', maxWidth: 440, maxHeight: '90%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl },
  modalTitle: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.md },
  modalError: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
  modalDescription: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  inputLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700', marginBottom: spacing.xs, marginTop: spacing.sm },
  optional: { fontWeight: '400', color: colors.textDisabled },
  input: { ...typography.body, color: colors.textPrimary, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  productPicker: { maxHeight: 150, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, marginBottom: spacing.xs },
  productChoice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  productChoiceSelected: { backgroundColor: colors.primaryLight },
  productChoiceText: { ...typography.caption, color: colors.textPrimary },
  productChoiceTextSelected: { color: colors.primary, fontWeight: '700' },
  productUnit: { ...typography.caption, color: colors.textSecondary },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  secondaryButtonText: { ...typography.label, color: colors.textPrimary },
  modalPrimaryButton: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  modalPrimaryText: { ...typography.label, color: colors.textInverse, fontWeight: '700' },
  deleteIcon: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, alignSelf: 'center' },
  deleteButton: { flex: 1, backgroundColor: colors.error, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
});
