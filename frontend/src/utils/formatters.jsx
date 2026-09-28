import { format, parseISO } from 'date-fns';

export const toDateTime = (value) => {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'PPp');
  } catch {
    return String(value);
  }
};

export const toDate = (value) => {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'PP');
  } catch {
    return String(value);
  }
};

export const currency = (value, code = 'USD') => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(n);
};

export const percent = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${n.toFixed(1)}%`;
};

export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

export const safeText = (value, fallback = '—') => (value === null || value === undefined || value === '' ? fallback : String(value));
