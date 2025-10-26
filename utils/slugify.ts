export const slugifyLocation = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const humanizeDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const locale =
    typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
  const date = new Date(isoDate);
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};
