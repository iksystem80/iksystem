export function formatPhone(value) {
  if (!value) return '';

  const digits = value.toString().replace(/\D/g, '');

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return value;
}

export function unformatPhone(value) {
  if (!value) return '';

  return value.toString().replace(/\D/g, '');
}
