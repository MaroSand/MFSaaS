import { colors, radius, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Acerca de la app</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Pressable
            style={styles.row}
            onPress={() => router.push('/(tabs)/profile/about/terms')}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.textPrimary}
              />
              <Text style={styles.rowText}>Términos y condiciones</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textDisabled}
            />
          </Pressable>

          <View style={styles.separator} />

          <Pressable
            style={styles.row}
            onPress={() => router.push('/(tabs)/profile/about/privacy')}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.textPrimary}
              />
              <Text style={styles.rowText}>Política de privacidad</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textDisabled}
            />
          </Pressable>
        </View>

        <Text style={styles.version}>
          Versión {Constants.expoConfig?.version ?? '—'}
        </Text>
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
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 20 + spacing.md,
  },
  version: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});