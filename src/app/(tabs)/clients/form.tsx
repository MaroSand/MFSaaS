import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clientsService } from '../../../services/api/clientsService';
import { colors, radius, spacing, typography } from '../../../theme';
import { IAddress } from '../../../types';

type ClientFormData = {
  businessName: string;
  taxId: string;
  phone: string;
  email: string;
  street: string;
  city: string;
};

export default function ClientFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  
  const [loading, setLoading] = useState(!!clientId);
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!clientId;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    defaultValues: {
      businessName: '',
      taxId: '',
      phone: '',
      email: '',
      street: '',
      city: '',
    },
  });

  useEffect(() => {
    if (isEditMode && clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const client = await clientsService.getClientById(clientId);
      const address = client.addresses[0];
      reset({
        businessName: client.businessName,
        taxId: client.taxId,
        phone: client.phone,
        email: client.email,
        street: address?.street || '',
        city: address?.city || '',
      });
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar el cliente');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      setSubmitting(true);

      const address: IAddress = {
        id: `a${Date.now()}`,
        street: data.street,
        city: data.city,
        label: 'Dirección principal',
      };

      const clientData = {
        businessName: data.businessName,
        taxId: data.taxId,
        phone: data.phone,
        email: data.email,
        addresses: [address],
        totalDebt: 0,
      };

      if (isEditMode && clientId) {
        // Update
        await clientsService.updateClient(clientId, clientData);
        Alert.alert('Éxito', 'Cliente actualizado correctamente');
      } else {
        // Create
        await clientsService.createClient(clientData);
        Alert.alert('Éxito', 'Cliente creado correctamente');
      }

      router.back();
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar el cliente');
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
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, errors.businessName && styles.inputError]}
                  placeholder="Ej: Carnicería El Centro"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  editable={!submitting}
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
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, errors.taxId && styles.inputError]}
                  placeholder="XX-XXXXXXXX-X"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  editable={!submitting}
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
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="3644123456"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  editable={!submitting}
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
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="contacto@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  editable={!submitting}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Street */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Dirección (calle) *</Text>
            <Controller
              control={control}
              name="street"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, errors.street && styles.inputError]}
                  placeholder="Av. San Martín 123"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  editable={!submitting}
                />
              )}
            />
            {errors.street && (
              <Text style={styles.errorText}>{errors.street.message}</Text>
            )}
          </View>

          {/* City */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Localidad *</Text>
            <Controller
              control={control}
              name="city"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, errors.city && styles.inputError]}
                  placeholder="Presidencia Roque Sáenz Peña"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  editable={!submitting}
                />
              )}
            />
            {errors.city && (
              <Text style={styles.errorText}>{errors.city.message}</Text>
            )}
          </View>

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
          onPress={handleSubmit(onSubmit)}
          disabled={submitting}
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
