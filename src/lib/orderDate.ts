// Order days are keyed as midnight UTC (what startOfDay() gives on the UTC prod server);
// these helpers compute them in UTC so other time zones (e.g. UTC+7 dev) hit the same rows.

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
