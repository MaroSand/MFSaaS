import axios from 'axios';

export type FieldErrors = Record<string, string>;

const fieldAliases: Record<string, string> = {
  name: 'name', businessname: 'businessName', business_name: 'businessName',
  taxid: 'taxId', tax_id: 'taxId', cuit: 'taxId', phone: 'phone', telefono: 'phone',
  email: 'email', street: 'street', address: 'street', city: 'city', localidad: 'city',
  label: 'label',
  price: 'price', unitprice: 'price', unit_price: 'price', sku: 'sku', description: 'description', amount: 'amount', paymentamount: 'amount', payment_amount: 'amount',
  password: 'password', username: 'username', fullname: 'fullName', full_name: 'fullName',
};

function messageOf(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) return value.map(messageOf).filter(Boolean).join('\n') || undefined;
  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>;
    return messageOf(item.defaultMessage ?? item.message ?? item.error ?? item.msg);
  }
  return undefined;
}

export function parseApiError(error: unknown, fallback: string) {
  const data = axios.isAxiosError(error) ? error.response?.data : undefined;
  const body = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const rawErrors = body.errors ?? body.fieldErrors ?? body.violations;
  const fields: FieldErrors = {};
  if (Array.isArray(rawErrors)) {
    rawErrors.forEach((item: any) => {
      const rawField = String(item?.field ?? item?.propertyPath ?? '').split('.').pop()?.toLowerCase();
      const field = rawField && fieldAliases[rawField];
      const message = messageOf(item);
      if (field && message) fields[field] = message;
    });
  } else if (rawErrors && typeof rawErrors === 'object') {
    Object.entries(rawErrors as Record<string, unknown>).forEach(([key, value]) => {
      const field = fieldAliases[key.toLowerCase()];
      const message = messageOf(value);
      if (field && message) fields[field] = message;
    });
  }
  const serverMessage = messageOf(body.message ?? body.detail ?? body.title);
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const networkError = axios.isAxiosError(error) && !error.response;
  return {
    fields,
    message: networkError
      ? 'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.'
      : status && status >= 500
        ? 'El servidor tuvo un problema al guardar. Tus datos siguen acá; podés reintentar.'
        : serverMessage || fallback,
    networkError,
  };
}
