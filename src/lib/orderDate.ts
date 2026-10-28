// Orders are keyed by calendar day, stored as midnight UTC (e.g. 2026-10-27T00:00:00Z)
// because that is what startOfDay() returns on the UTC production server. These helpers
// compute the same keys in UTC explicitly, so a server in another time zone (like a
// dev machine in UTC+7) reads and writes the same rows instead of 17:00 the day before.

// Midnight UTC of the given instant's UTC calendar day
export function orderDay(value: Date | string | number = new Date()) {
  const date = new Date(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

// First and last moment of a "yyyy-MM" month, matching the day keys above
export function orderMonthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    end: new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59)),
  };
}
