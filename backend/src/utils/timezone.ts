type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

// Minutes to add to UTC to get wall-clock time in `timeZone` at `date`.
function offsetMinutes(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** ISO-8601 with the zone's offset, e.g. 2026-09-19T07:33:00+07:00 */
export function formatIsoInZone(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  const offset = offsetMinutes(date, timeZone);
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);

  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Start and end instants of the calendar day containing `date` in `timeZone`. */
export function dayRangeInZone(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);

  const midnight = (dayOffset: number) => {
    const wallClock = Date.UTC(p.year, p.month - 1, p.day + dayOffset);
    // Re-check the offset at the resulting instant so DST days are correct.
    const guess = wallClock - offsetMinutes(new Date(wallClock), timeZone) * 60000;
    return wallClock - offsetMinutes(new Date(guess), timeZone) * 60000;
  };

  return {
    start: new Date(midnight(0)),
    end: new Date(midnight(1) - 1),
  };
}
