import { Redirect } from 'expo-router';
import { useAuthStore } from '../store';

// Ruta raíz ("/"). Sin este archivo, entrar a "/" directamente
// (por ejemplo al abrir la app en el navegador) cae en "Unmatched Route"
// antes de que el useEffect de AuthGuard llegue a redirigir.
// Con <Redirect> la redirección es declarativa y ocurre en el primer render.
export default function Index() {
  const { isAuthenticated } = useAuthStore();
  return <Redirect href={isAuthenticated ? '/(tabs)/catalog' : '/(auth)/login'} />;
}