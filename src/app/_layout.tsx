import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store';
import { loadRememberedSession } from '../services/authSessionStorage';
import { LoadingScreen } from '../components/layout';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const setAuth = useAuthStore(state => state.setAuth);
  const segments = useSegments();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    loadRememberedSession()
      .then(session => {
        if (!active || !session) return;
        setAuth({
          id: session.username,
          username: session.username,
          fullName: session.username,
          role: 'unknown',
          permissions: [],
          tenantId: '',
        }, session.token, session.tokenType);
      })
      .catch(storageError => console.warn('No se pudo restaurar la sesión', storageError))
      .finally(() => { if (active) setSessionReady(true); });
    return () => { active = false; };
  }, [setAuth]);

  useEffect(() => {
    if (!mounted || !sessionReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/catalog');
    }
  }, [isAuthenticated, segments, mounted, sessionReady]);

  if (!sessionReady) return <LoadingScreen message="Cargando sesión…" />;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGuard>
  );
}
