import { colors, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// TODO: Reemplazar por el texto legal real de Términos y Condiciones.
const PLACEHOLDER_TEXT = `Este es un texto de referencia (placeholder) para los Términos y Condiciones de la aplicación.

Acá va a ir el contenido legal definitivo: condiciones de uso del servicio, responsabilidades del usuario, políticas de cuenta y cualquier cláusula que el equipo legal considere necesaria.

Reemplazar este bloque antes de publicar la app.`;

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Términos y condiciones</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>{PLACEHOLDER_TEXT}</Text>
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});