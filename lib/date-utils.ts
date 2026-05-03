const dutchDateFormatter = new Intl.DateTimeFormat("nl-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDutchDateFormatter = new Intl.DateTimeFormat("nl-BE", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function fromDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function eachDate(startDate: Date, endDate: Date) {
  const days: Date[] = [];
  for (let day = new Date(startDate); day <= endDate; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

export function formatDutchDate(date: Date) {
  return dutchDateFormatter.format(date);
}

export function formatShortDutchDate(date: Date) {
  return shortDutchDateFormatter.format(date);
}

export function formatRange(startDate: Date, endDate: Date) {
  return `${formatShortDutchDate(startDate)} - ${formatShortDutchDate(endDate)}`;
}

export function startOfMonthGrid(referenceDate = new Date()) {
  const firstOfMonth = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
  );
  const weekday = firstOfMonth.getUTCDay() || 7;
  return addDays(firstOfMonth, 1 - weekday);
}

export function calendarWindow(referenceDate = new Date(), weeks = 8) {
  const start = startOfMonthGrid(referenceDate);
  const end = addDays(start, weeks * 7 - 1);
  return {
    start,
    end,
    days: eachDate(start, end),
  };
}

export function dateInputValue(date: Date | null | undefined) {
  return date ? toDateKey(date) : "";
}
