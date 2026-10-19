const relativeTime = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

function dateOrOriginal(iso: string): Date | null {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Formatea número como moneda argentina: 12500 → "$12.500" */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-AR')}`;
}

/** Formatea fecha ISO a formato legible: "15 jun 2026" */
export function formatDate(iso: string): string {
  const date = dateOrOriginal(iso);
  return date ? date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\.$/, '') : iso;
}

/** Formatea fecha ISO con hora: "15 jun 2026 · 14:30" */
export function formatDateTime(iso: string): string {
  const date = dateOrOriginal(iso);
  if (!date) return iso;
  const datePart = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\.$/, '');
  const timePart = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${datePart} · ${timePart}`;
}

/** Tiempo relativo: "hace 2 horas" */
export function fromNow(iso: string): string {
  const date = dateOrOriginal(iso);
  if (!date) return iso;
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000], ['month', 2_592_000], ['week', 604_800],
    ['day', 86_400], ['hour', 3_600], ['minute', 60], ['second', 1],
  ];
  const [unit, duration] = units.find(([, duration]) => Math.abs(seconds) >= duration) ?? ['second', 1];
  return relativeTime.format(Math.round(seconds / duration), unit);
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
