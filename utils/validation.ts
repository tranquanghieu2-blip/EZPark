export const isDayRestricted = (now: Date, days: string[]): boolean => {
  const dayMap = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ];
  const today = dayMap[now.getDay()];
  return days.includes(today);
};

export const isWithinTimeRange = (now: Date, ranges: TimeRange[]): boolean => {
  const current = now.toTimeString().split(" ")[0];
  return ranges.some((range) => current >= range.start && current <= range.end);
};
