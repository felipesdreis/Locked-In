// Returns YYYY-MM-DD in local time — avoids UTC offset shifting the day.
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Parses a YYYY-MM-DD string as local time to avoid UTC offset shifting the day.
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

// Returns the ISO week start (Monday) for the given date
export function startOfIsoWeek(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon...6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return d;
}

// Returns all YYYY-MM-DD strings for the current ISO week (Mon–Sun)
export function currentIsoWeekDates(today: Date): string[] {
  const monday = startOfIsoWeek(today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateString(d);
  });
}

export function getLast(n: number, unit: 'days' | 'weeks'): Date[] {
  const result: Date[] = [];
  const today = new Date();
  const step = unit === 'days' ? 1 : 7;
  for (let i = n - 1; i >= 0; i--) {
    result.push(subtractDays(today, i * step));
  }
  return result;
}

const PT_BR_MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const PT_BR_MONTHS_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

// Returns "28 de maio de 2026"
export function formatDateBR(date: Date): string {
  const d = date.getDate();
  const m = PT_BR_MONTHS[date.getMonth()];
  const y = date.getFullYear();
  return `${d} de ${m} de ${y}`;
}

// Returns "28/05/2026"
export function formatDateShortBR(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Returns "mai 2026"
export function formatMonthYearBR(date: Date): string {
  return `${PT_BR_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}
