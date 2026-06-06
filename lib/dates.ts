import { format, isSameDay, startOfDay } from "date-fns";

export function formatDateTime(date: Date) {
  return format(date, "MMM d, yyyy h:mm a");
}

export function formatDay(date: Date) {
  return format(date, "EEEE, MMM d");
}

export function dayKey(date: Date) {
  return format(startOfDay(date), "yyyy-MM-dd");
}

export function formatDateRange(startAt: Date, endAt: Date) {
  if (isSameDay(startAt, endAt)) {
    return `${format(startAt, "MMM d, h:mm a")} - ${format(endAt, "h:mm a")}`;
  }

  return `${formatDateTime(startAt)} - ${formatDateTime(endAt)}`;
}
