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

import { catalogService } from '../../../../services/api/catalogService';
import { colors, radius, spacing, typography } from '../../../../theme';
import { ICategory } from '../../../../types';

type CategoryFormData = {
  name: string;
  parentCategoryId: string; // '' = sin padre
};

export default function CategoryFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const isEditMode = !!categoryId;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    defaultValues: { name: '', parentCategoryId: '' },
  });

  const selectedParentId = watch('parentCategoryId');

  useEffect(() => {
    loadCategories();
    if (isEditMode && categoryId) {
      loadCategory(categoryId);
    }
  }, [categoryId]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const result = await catalogService.getCategories();
      setCategories(result);
    } catch (err) {
      // no bloquea el form si falla: solo no habrá selector de padre
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCategory = async (id: string) => {
    try {
      setLoading(true);
      const category = await catalogService.getCategoryById(id);
      reset({
        name: category.name,
        parentCategoryId: category.parentCategoryId || '',
      });
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la categoría');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setSubmitting(true);

      const payload: Partial<ICategory> = {
        name: data.name.trim(),
        parentCategoryId: data.parentCategoryId || undefined,
      };

      if (isEditMode && categoryId) {
        await catalogService.updateCategory(categoryId, payload);
        Alert.alert('Éxito', 'Categoría actualizada correctamente');
      } else {
        await catalogService.createCategory(payload);
        Alert.alert('Éxito', 'Categoría creada correctamente');
      }

      router.back();
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar la categoría');
    } finally {
      setSubmitting(false);
    }
  };

  // Evita elegirse a sí misma como padre
  const parentOptions = categories.filter(c => c.id !== categoryId);

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
          {isEditMode ? 'Editar categoría' : 'Crear categoría'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl + spacing.lg }}
      >
        <View style={styles.formContainer}>
          {/* Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nombre *</Text>
            <Controller
              control={control}
              name="name"
              rules={{ required: 'El nombre es obligatorio' }}
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Ej: Carnes rojas"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  editable={!submitting}
                />
              )}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
          </View>

          {/* Parent category selector */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Seleccione una categoría principal (opcional)</Text>
            {loadingCategories ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
            ) : (
              <Controller
                control={control}
                name="parentCategoryId"
                render={({ field: { onChange } }) => (
                  <View style={styles.chipsWrap}>
                    <TouchableOpacity
                      style={[styles.chip, selectedParentId === '' && styles.chipActive]}
                      onPress={() => onChange('')}
                      disabled={submitting}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedParentId === '' && styles.chipTextActive,
                        ]}
                      >
                        Sin padre
                      </Text>
                    </TouchableOpacity>
                    {parentOptions.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.chip,
                          selectedParentId === cat.id && styles.chipActive,
                        ]}
                        onPress={() => onChange(cat.id)}
                        disabled={submitting}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selectedParentId === cat.id && styles.chipTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            )}
            <Text style={styles.helperText}>
              Elegí una categoría principal si esta es una subcategoría.
            </Text>
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
              {isEditMode ? 'Actualizar' : 'Crear categoría'}
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
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.textInverse,
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