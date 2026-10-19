import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clientsService } from '../../../services/api/clientsService';
import { usePermissions } from '../../../hooks/usePermissions';
import { colors, radius, spacing, typography } from '../../../theme';
import { IAddress } from '../../../types';
import { FormErrorBanner } from '../../../components/ui/FormErrorBanner';
import { parseApiError } from '../../../utils/apiErrors';

type ClientFormData = {
  businessName: string;
  taxId: string;
  phone: string;
  email: string;
  addresses: { id: string; label: string; street: string; city: string; isDefault: boolean }[];
};

export default function ClientFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { canManageClients } = usePermissions();
  useEffect(() => { if (!canManageClients) router.replace('/(tabs)/clients' as any); }, [canManageClients, router]);
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  
  const [loading, setLoading] = useState(!!clientId);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isEditMode = !!clientId;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    setFocus,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitted, touchedFields },
  } = useForm<ClientFormData>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      businessName: '',
      taxId: '',
      phone: '',
      email: '',
      addresses: [{ id: '', label: 'Dirección principal', street: '', city: '', isDefault: true }],
    },
  });
  const { fields: addressFields, append, remove } = useFieldArray({ control, name: 'addresses', keyName: 'fieldKey' });
  const addressValues = watch('addresses') ?? [];

  const makeDefaultAddress = (defaultIndex: number) => {
    addressFields.forEach((_, index) => {
      setValue(`addresses.${index}.isDefault`, index === defaultIndex, { shouldDirty: true });
    });
  };

  const removeAddress = (index: number) => {
    const removedDefault = addressValues[index]?.isDefault;
    remove(index);
    if (removedDefault && addressFields.length > 1) setTimeout(() => makeDefaultAddress(0), 0);
  };

  useEffect(() => {
    if (!canManageClients) return;
    if (isEditMode && clientId) {
      loadClient();
    }
  }, [clientId, canManageClients]);

  const loadClient = async () => {
    if (!clientId) return;
    try {
      setLoadError(null);
      setLoading(true);
      const client = await clientsService.getClientById(clientId);
      const addresses = client.addresses.length
        ? client.addresses
        : [{ id: '', label: 'Dirección principal', street: '', city: '', isDefault: true }];
      reset({
        businessName: client.businessName,
        taxId: client.taxId,
        phone: client.phone,
        email: client.email,
        addresses: addresses.map((address, index) => ({
          id: address.id,
          label: address.label || `Dirección ${index + 1}`,
          street: address.street,
          city: address.city,
          isDefault: address.isDefault ?? index === 0,
        })),
      });
    } catch (err) {
      setLoadError(parseApiError(err, 'No se pudo cargar el cliente.').message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      setSubmitting(true);
      setServerError(null);
      clearErrors();

      const addresses: IAddress[] = data.addresses.map(address => ({
        id: address.id,
        street: address.street.trim(),
        city: address.city.trim(),
        label: address.label.trim() || 'Dirección',
        isDefault: address.isDefault,
      }));

      const clientData = {
        businessName: data.businessName.trim(),
        taxId: data.taxId.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        active: true,
        addresses,
        totalDebt: 0,
      };

      if (isEditMode && clientId) {
        // Update
        await clientsService.updateClient(clientId, clientData);
      } else {
        // Create
        await clientsService.createClient(clientData);
      }

      router.back();
    } catch (err) {
      const parsed = parseApiError(err, 'No se pudo guardar el cliente. Revisá los datos e intentá de nuevo.');
      const backendFields = { ...parsed.fields, ...(parsed.fields.name ? { businessName: parsed.fields.name } : {}) };
      const knownFields = Object.fromEntries(Object.entries(backendFields).filter(([field]) =>
        ['businessName', 'taxId', 'phone', 'email'].includes(field),
      ));
      Object.entries(knownFields).forEach(([field, message]) => {
        setError(field as keyof ClientFormData, { type: 'server', message });
      });
      const addressMessages: string[] = [];
      if (parsed.fields.street) {
        setError('addresses.0.street', { type: 'server', message: parsed.fields.street });
        addressMessages.push(parsed.fields.street);
      }
      if (parsed.fields.city) {
        setError('addresses.0.city', { type: 'server', message: parsed.fields.city });
        addressMessages.push(parsed.fields.city);
      }
      if (parsed.fields.label) {
        setError('addresses.0.label', { type: 'server', message: parsed.fields.label });
        addressMessages.push(parsed.fields.label);
      }
      setServerError(Object.keys(knownFields).length || addressMessages.length ? null : parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Editar cliente' : 'Crear cliente'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl + spacing.lg }}
      >
        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Business Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Razón social *</Text>
            <Controller
              control={control}
              name="businessName"
              rules={{ required: 'Ingresá la razón social.', validate: value => !!value.trim() || 'La razón social no puede estar vacía.', minLength: { value: 2, message: 'Usá al menos 2 caracteres.' }, maxLength: { value: 120, message: 'No puede superar 120 caracteres.' } }}
              render={({ field: { value, onChange, onBlur, ref } }) => (
                <TextInput
                  ref={ref}
                  style={[styles.input, errors.businessName ? styles.inputError : touchedFields.businessName && styles.inputValid]}
                  placeholder="Ej: Carnicería El Centro"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={value => { onChange(value); setServerError(null); }}
                  onBlur={onBlur}
                  editable={!submitting}
                  maxLength={120}
                />
              )}
            />
            {errors.businessName && (
              <Text style={styles.errorText}>{errors.businessName.message}</Text>
            )}
          </View>

          {/* Tax ID */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>CUIT *</Text>
            <Controller
              control={control}
              name="taxId"
              rules={{ required: 'Ingresá el CUIT.', pattern: { value: /^\d{2}-?\d{8}-?\d$/, message: 'Ingresá un CUIT válido (11 dígitos).' } }}
              render={({ field: { value, onChange, onBlur, ref } }) => (
                <TextInput
                  ref={ref}
                  style={[styles.input, errors.taxId ? styles.inputError : touchedFields.taxId && styles.inputValid]}
                  placeholder="XX-XXXXXXXX-X"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={value => { onChange(value); setServerError(null); }}
                  onBlur={onBlur}
                  editable={!submitting}
                  maxLength={13}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.taxId && (
              <Text style={styles.errorText}>{errors.taxId.message}</Text>
            )}
            <Text style={styles.helperText}>Formato: XX-XXXXXXXX-X</Text>
          </View>

          {/* Phone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Teléfono *</Text>
            <Controller
              control={control}
              name="phone"
              rules={{ required: 'Ingresá un teléfono.', pattern: { value: /^(?=(?:.*\d){7,})[+\d\s().-]{7,20}$/, message: 'Ingresá un teléfono válido con al menos 7 dígitos.' } }}
              render={({ field: { value, onChange, onBlur, ref } }) => (
                <TextInput
                  ref={ref}
                  style={[styles.input, errors.phone ? styles.inputError : touchedFields.phone && styles.inputValid]}
                  placeholder="3644123456"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={value => { onChange(value); setServerError(null); }}
                  onBlur={onBlur}
                  editable={!submitting}
                  maxLength={20}
                  keyboardType="phone-pad"
                />
              )}
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone.message}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email *</Text>
            <Controller
              control={control}
              name="email"
              rules={{ required: 'Ingresá un email.', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Ingresá un email válido.' }, maxLength: { value: 254, message: 'El email es demasiado largo.' } }}
              render={({ field: { value, onChange, onBlur, ref } }) => (
                <TextInput
                  ref={ref}
                  style={[styles.input, errors.email ? styles.inputError : touchedFields.email && styles.inputValid]}
                  placeholder="contacto@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={value => { onChange(value); setServerError(null); }}
                  onBlur={onBlur}
                  editable={!submitting}
                  maxLength={254}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          <View style={styles.addressSectionHeader}>
            <Text style={styles.label}>Direcciones *</Text>
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => append({ id: '', label: `Dirección ${addressFields.length + 1}`, street: '', city: '', isDefault: addressFields.length === 0 })}
              disabled={submitting}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.addAddressText}>Agregar</Text>
            </TouchableOpacity>
          </View>
          {addressFields.map((addressField, index) => {
            const addressErrors = errors.addresses?.[index];
            const addressTouched = touchedFields.addresses?.[index];
            return (
              <View key={addressField.fieldKey} style={styles.addressCard}>
                <View style={styles.addressCardHeader}>
                  <Text style={styles.addressCardTitle}>{addressValues[index]?.label || `Dirección ${index + 1}`}</Text>
                  {addressFields.length > 1 && (
                    <TouchableOpacity onPress={() => removeAddress(index)} disabled={submitting} accessibilityLabel="Eliminar dirección">
                      <Ionicons name="trash-outline" size={19} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.label}>Etiqueta</Text>
                <Controller
                  control={control}
                  name={`addresses.${index}.label`}
                  rules={{ maxLength: { value: 80, message: 'No puede superar 80 caracteres.' } }}
                  render={({ field: { value, onChange, onBlur, ref } }) => (
                    <TextInput ref={ref} style={[styles.input, addressErrors?.label ? styles.inputError : addressTouched?.label && styles.inputValid]} placeholder="Casa, depósito..." placeholderTextColor={colors.textSecondary} value={value} onChangeText={text => { onChange(text); setServerError(null); }} onBlur={onBlur} editable={!submitting} maxLength={80} />
                  )}
                />
                {!!addressErrors?.label && <Text style={styles.errorText}>{addressErrors.label.message}</Text>}

                <Text style={styles.label}>Calle y altura *</Text>
                <Controller
                  control={control}
                  name={`addresses.${index}.street`}
                  rules={{ required: 'Ingresá la calle y altura.', validate: value => !!value.trim() || 'Ingresá una dirección válida.', minLength: { value: 3, message: 'Ingresá una dirección válida.' }, maxLength: { value: 255, message: 'No puede superar 255 caracteres.' } }}
                  render={({ field: { value, onChange, onBlur, ref } }) => (
                    <TextInput ref={ref} style={[styles.input, addressErrors?.street ? styles.inputError : addressTouched?.street && styles.inputValid]} placeholder="Av. San Martín 123" placeholderTextColor={colors.textSecondary} value={value} onChangeText={text => { onChange(text); setServerError(null); }} onBlur={onBlur} editable={!submitting} maxLength={255} />
                  )}
                />
                {!!addressErrors?.street && <Text style={styles.errorText}>{addressErrors.street.message}</Text>}

                <Text style={styles.label}>Localidad *</Text>
                <Controller
                  control={control}
                  name={`addresses.${index}.city`}
                  rules={{ required: 'Ingresá la localidad.', validate: value => !!value.trim() || 'Ingresá una localidad válida.', minLength: { value: 2, message: 'Ingresá una localidad válida.' }, maxLength: { value: 100, message: 'No puede superar 100 caracteres.' } }}
                  render={({ field: { value, onChange, onBlur, ref } }) => (
                    <TextInput ref={ref} style={[styles.input, addressErrors?.city ? styles.inputError : addressTouched?.city && styles.inputValid]} placeholder="Presidencia Roque Sáenz Peña" placeholderTextColor={colors.textSecondary} value={value} onChangeText={text => { onChange(text); setServerError(null); }} onBlur={onBlur} editable={!submitting} maxLength={100} />
                  )}
                />
                {!!addressErrors?.city && <Text style={styles.errorText}>{addressErrors.city.message}</Text>}

                <TouchableOpacity style={styles.defaultAddressRow} onPress={() => makeDefaultAddress(index)} disabled={submitting} accessibilityRole="radio" accessibilityState={{ selected: !!addressValues[index]?.isDefault }}>
                  <Ionicons name={addressValues[index]?.isDefault ? 'radio-button-on' : 'radio-button-off'} size={18} color={addressValues[index]?.isDefault ? colors.primary : colors.textSecondary} />
                  <Text style={styles.defaultAddressText}>{addressValues[index]?.isDefault ? 'Dirección principal' : 'Marcar como principal'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {!!loadError && <FormErrorBanner message={loadError} onRetry={loadClient} />}
          {!!serverError && <FormErrorBanner message={serverError} onRetry={() => handleSubmit(onSubmit)()} />}
          <Text style={styles.requiredNote}>* campos obligatorios</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit(onSubmit, invalid => {
            const first = Object.keys(invalid)[0];
            if (first === 'addresses') {
              const addressErrors = invalid.addresses as Record<string, Record<string, unknown>> | undefined;
              const index = addressErrors ? Object.keys(addressErrors).find(key => /^\d+$/.test(key)) : undefined;
              const field = index && ['label', 'street', 'city'].find(key => addressErrors?.[index]?.[key]);
              if (index && field) setTimeout(() => setFocus(`addresses.${index}.${field}` as any), 0);
            } else if (first) {
              setTimeout(() => setFocus(first as any), 0);
            }
          })}
          disabled={submitting || (isSubmitted && !isValid)}
        >
          {submitting ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Actualizar' : 'Crear cliente'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  addressSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, marginTop: spacing.md },
  addAddressButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  addAddressText: { ...typography.label, color: colors.primary },
  addressCard: { padding: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  addressCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  addressCardTitle: { ...typography.label, color: colors.textPrimary, fontWeight: '600' },
  defaultAddressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, marginTop: spacing.xs },
  defaultAddressText: { ...typography.caption, color: colors.textSecondary },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputValid: { borderColor: colors.success },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  requiredNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    ...typography.label,
    color: colors.textInverse,
    fontWeight: '600',
  },
});
