const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

const toLocalDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toDateInputValue = (value?: string | Date | null): string => {
  if (!value) return '';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return toLocalDateInputValue(value);
  }

  const text = value.trim();
  if (!text) return '';

  const directMatch = text.match(DATE_INPUT_PATTERN);
  if (directMatch) {
    return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return '';

  return toLocalDateInputValue(parsed);
};

export const getTodayDateInputValue = (): string => toLocalDateInputValue(new Date());

export const formatDateForDisplay = (value?: string | Date | null): string => {
  const normalizedDate = toDateInputValue(value);
  if (!normalizedDate) return '';

  const [year, month, day] = normalizedDate.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
