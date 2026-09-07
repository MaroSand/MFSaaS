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

// TODO: Reemplazar por el texto legal real de la Política de Privacidad.
const PLACEHOLDER_TEXT = `Este es un texto de referencia (placeholder) para la Política de Privacidad de la aplicación.

Acá va a ir el contenido definitivo: qué datos se recolectan, cómo se almacenan y usan, con quién se comparten, y los derechos del usuario sobre su información personal.

Reemplazar este bloque antes de publicar la app.`;

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Política de privacidad</Text>
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