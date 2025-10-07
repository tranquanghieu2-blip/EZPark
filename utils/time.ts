type TimeRange = { start: string; end: string };

export function getAllowedTimeRanges(forbidden: TimeRange[]): TimeRange[] {
  if (!forbidden || forbidden.length === 0) {
    return [{ start: "00:00:00", end: "23:59:59" }];
  }

  const sorted = [...forbidden].sort((a, b) => a.start.localeCompare(b.start));
  const allowed: TimeRange[] = [];
  let lastEnd = "00:00:00";

  sorted.forEach((range) => {
    if (range.start > lastEnd) {
      allowed.push({ start: lastEnd, end: range.start });
    }
    if (range.end > lastEnd) {
      lastEnd = range.end;
    }
  });

  if (lastEnd < "23:59:59") {
    allowed.push({ start: lastEnd, end: "23:59:59" });
  }

  return allowed;
}
