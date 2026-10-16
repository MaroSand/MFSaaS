import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormErrorBanner } from '../../../../components/ui/FormErrorBanner';
import { useCategories } from '../../../../hooks';
import { ProductWriteRequest, productsService } from '../../../../services/api/productsService';
import { colors, radius, spacing, typography } from '../../../../theme';
import { parseApiError } from '../../../../utils/apiErrors';

export default function ProductFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ productId?: string }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const editing = !!productId;
  const { categories } = useCategories();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const nameInput = React.useRef<TextInput>(null);
  const priceInput = React.useRef<TextInput>(null);

  const validate = (field: string, value: string) => {
    if (field === 'name') return !value.trim() ? 'El nombre es obligatorio.' : value.trim().length < 2 ? 'Usá al menos 2 caracteres.' : value.length > 150 ? 'No puede superar 150 caracteres.' : '';
    if (field === 'price') {
      const amount = Number(value.trim().replace(',', '.'));
      return !value.trim() || !Number.isFinite(amount) || amount < 0 ? 'Ingresá un precio válido mayor o igual a cero.' : '';
    }
    if (field === 'description') return value.length > 1000 ? 'No puede superar 1000 caracteres.' : '';
    if (field === 'sku') return value.length > 50 ? 'No puede superar 50 caracteres.' : '';
    return '';
  };
  const changeField = (field: string, value: string, setter: (value: string) => void) => {
    setter(value);
    setFieldErrors(current => ({ ...current, [field]: attempted ? validate(field, value) : '' }));
    setServerError(null);
  };

  const loadProduct = async () => {
    if (!productId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const product = await productsService.getProductById(productId, categories);
      setName(product.name);
      setDescription(product.description);
      setSku(product.sku || '');
      setPrice(String(product.price));
      setCategoryId(product.category.id);
    } catch (err: any) {
      setLoadError(parseApiError(err, 'No se pudo cargar el producto.').message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [productId, categories]);

  const submit = async () => {
    setAttempted(true);
    const parsedPrice = Number(price.trim().replace(',', '.'));
    const nextErrors = { name: validate('name', name), price: validate('price', price), description: validate('description', description), sku: validate('sku', sku) };
    setFieldErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors).find(key => !!nextErrors[key as keyof typeof nextErrors]);
    if (firstInvalid) {
      (firstInvalid === 'price' ? priceInput : nameInput).current?.focus();
      return;
    }
    setServerError(null);
    const payload: ProductWriteRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      sku: sku.trim() || undefined,
      unitPrice: parsedPrice,
      categoryId: categoryId ? Number(categoryId) : null,
    };

    setSubmitting(true);
    try {
      if (productId) await productsService.updateProduct(productId, payload);
      else await productsService.createProduct(payload);
      Alert.alert('Listo', editing ? 'Producto actualizado.' : 'Producto creado.');
      router.back();
    } catch (err: any) {
      const parsed = parseApiError(err, 'No se pudo guardar el producto. Revisá los datos e intentá de nuevo.');
      const knownFields = ['name', 'price', 'description', 'sku'];
      const mapped = Object.fromEntries(Object.entries(parsed.fields).filter(([key]) => knownFields.includes(key)));
      setFieldErrors(current => ({ ...current, ...mapped }));
      setServerError(Object.keys(mapped).length ? null : parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadError) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        {loading ? <ActivityIndicator size="large" color={colors.primary} /> : (
          <>
            <Text style={styles.error}>{loadError}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={loadProduct}><Text style={styles.primaryButtonText}>Reintentar</Text></TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Volver"><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>{editing ? 'Editar producto' : 'Nuevo producto'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nombre *</Text>
        <TextInput ref={nameInput} style={[styles.input, fieldErrors.name ? styles.inputError : touched.name && name.trim() ? styles.inputValid : null]} value={name} onChangeText={value => changeField('name', value, setName)} onBlur={() => { setTouched(t => ({ ...t, name: true })); setFieldErrors(e => ({ ...e, name: validate('name', name) })); }} placeholder="Nombre del producto" editable={!submitting} maxLength={150} />
        {!!fieldErrors.name && <Text style={styles.fieldError}>{fieldErrors.name}</Text>}

        <Text style={styles.label}>Precio *</Text>
        <TextInput ref={priceInput} style={[styles.input, fieldErrors.price ? styles.inputError : touched.price && price.trim() ? styles.inputValid : null]} value={price} onChangeText={value => changeField('price', value, setPrice)} onBlur={() => { setTouched(t => ({ ...t, price: true })); setFieldErrors(e => ({ ...e, price: validate('price', price) })); }} placeholder="0,00" keyboardType="decimal-pad" editable={!submitting} />
        {!!fieldErrors.price && <Text style={styles.fieldError}>{fieldErrors.price}</Text>}

        <Text style={styles.label}>Descripción</Text>
        <TextInput style={[styles.input, styles.multiline, fieldErrors.description ? styles.inputError : touched.description && styles.inputValid]} value={description} onChangeText={value => changeField('description', value, setDescription)} onBlur={() => { setTouched(t => ({ ...t, description: true })); setFieldErrors(e => ({ ...e, description: validate('description', description) })); }} placeholder="Descripción (opcional)" multiline editable={!submitting} maxLength={1000} />
        {!!fieldErrors.description && <Text style={styles.fieldError}>{fieldErrors.description}</Text>}

        <Text style={styles.label}>SKU</Text>
        <TextInput style={[styles.input, fieldErrors.sku ? styles.inputError : touched.sku && sku.trim() ? styles.inputValid : null]} value={sku} onChangeText={value => changeField('sku', value, setSku)} onBlur={() => { setTouched(t => ({ ...t, sku: true })); setFieldErrors(e => ({ ...e, sku: validate('sku', sku) })); }} placeholder="Código del producto (opcional)" editable={!submitting} maxLength={50} autoCapitalize="characters" />
        {!!fieldErrors.sku && <Text style={styles.fieldError}>{fieldErrors.sku}</Text>}

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.chips}>
          <TouchableOpacity style={[styles.chip, !categoryId && styles.chipSelected]} onPress={() => setCategoryId('')} disabled={submitting}>
            <Text style={[styles.chipText, !categoryId && styles.chipTextSelected]}>Sin categoría</Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity key={category.id} style={[styles.chip, categoryId === category.id && styles.chipSelected]} onPress={() => setCategoryId(category.id)} disabled={submitting}>
              <Text style={[styles.chipText, categoryId === category.id && styles.chipTextSelected]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!serverError && <FormErrorBanner message={serverError} onRetry={submit} />}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={submitting}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.primaryButton, attempted && Object.values(fieldErrors).some(Boolean) && styles.buttonDisabled]} onPress={submit} disabled={submitting || (attempted && Object.values(fieldErrors).some(Boolean))}>
          {submitting ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.primaryButtonText}>{editing ? 'Guardar cambios' : 'Crear producto'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.heading, color: colors.textPrimary },
  form: { padding: spacing.lg, paddingBottom: spacing.xl },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { ...typography.body, color: colors.textPrimary, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  inputError: { borderColor: colors.error },
  inputValid: { borderColor: colors.success },
  fieldError: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
  buttonDisabled: { opacity: 0.5 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.primaryLight },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  chipTextSelected: { color: colors.textInverse },
  note: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.lg },
  error: { ...typography.body, color: colors.error, textAlign: 'center', marginTop: spacing.md },
  footer: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  cancelButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  cancelText: { ...typography.label, color: colors.textPrimary },
  primaryButton: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md },
  primaryButtonText: { ...typography.label, color: colors.textInverse },
});
