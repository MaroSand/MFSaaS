import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

/** Formatea número como moneda argentina: 12500 → "$12.500" */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-AR')}`;
}

/** Formatea fecha ISO a formato legible: "15 jun 2026" */
export function formatDate(iso: string): string {
  return dayjs(iso).format('D MMM YYYY');
}

/** Formatea fecha ISO con hora: "15 jun 2026 · 14:30" */
export function formatDateTime(iso: string): string {
  return dayjs(iso).format('D MMM YYYY · HH:mm');
}

/** Tiempo relativo: "hace 2 horas" */
export function fromNow(iso: string): string {
  return dayjs(iso).fromNow();
}

/** Formatea CUIT con guiones: "20123456781" → "20-12345678-1" */
export function formatCuit(cuit: string): string {
  const clean = cuit.replace(/\D/g, '');
  if (clean.length !== 11) return cuit;
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
}

/** Capitaliza primera letra */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
