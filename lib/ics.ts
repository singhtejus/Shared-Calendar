import { getAppUrl } from "@/lib/links";

type IcsEvent = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date;
  endAt: Date;
  createdAt: Date;
};

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function icsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldLine(line: string) {
  if (line.length <= 74) return line;

  const chunks = [line.slice(0, 74)];
  let remaining = line.slice(74);

  while (remaining.length > 73) {
    chunks.push(` ${remaining.slice(0, 73)}`);
    remaining = remaining.slice(73);
  }

  if (remaining.length > 0) chunks.push(` ${remaining}`);
  return chunks.join("\r\n");
}

export function generateIcs(events: IcsEvent[], calendarName = "Timeshare") {
  const host = new URL(getAppUrl()).host || "timeshare.local";
  const now = icsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Timeshare//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcs(`${event.id}@${host}`)}`,
      `DTSTAMP:${now}`,
      `CREATED:${icsDate(event.createdAt)}`,
      `DTSTART:${icsDate(event.startAt)}`,
      `DTEND:${icsDate(event.endAt)}`,
      `SUMMARY:${escapeIcs(event.title)}`
    );

    if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
