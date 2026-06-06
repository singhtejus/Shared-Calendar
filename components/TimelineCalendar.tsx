"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";

import { createAvailabilityAction } from "@/app/actions/availability";
import { createEventAction } from "@/app/actions/events";

type Member = {
  id: string;
  displayName: string;
  freeColor: string;
  busyColor: string;
};

type AvailabilityBlock = {
  id: string;
  status: "FREE" | "BUSY";
  startAt: string;
  endAt: string;
  note?: string | null;
  member: Member;
};

type TimelineEvent = {
  id: string;
  timelineId: string;
  title: string;
  location?: string | null;
  startAt: string;
  endAt: string;
  subscriptions: { id: string }[];
};

type TimelineCalendarProps = {
  timelineId: string;
  availabilityBlocks: AvailabilityBlock[];
  events: TimelineEvent[];
};

const hours = Array.from({ length: 24 }, (_, index) => index);

function dateFromHour(day: Date, hour: number) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
}

function inputValue(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function eventDate(value: string) {
  return new Date(value);
}

function overlaps(startAt: string, endAt: string, slotStart: Date, slotEnd: Date) {
  return eventDate(startAt) < slotEnd && eventDate(endAt) > slotStart;
}

function isSameCalendarDay(value: string, day: Date) {
  return isSameDay(eventDate(value), day);
}

export function TimelineCalendar({ timelineId, availabilityBlocks, events }: TimelineCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState(today);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<"availability" | "event">("availability");

  const monthDays = useMemo(() => {
    const first = startOfWeek(startOfMonth(visibleMonth));
    const last = endOfWeek(endOfMonth(visibleMonth));
    return eachDayOfInterval({ start: first, end: last });
  }, [visibleMonth]);

  const selectedRange = useMemo(() => {
    if (selectionStart === null || selectionEnd === null) return null;

    const startHour = Math.min(selectionStart, selectionEnd);
    const endHour = Math.max(selectionStart, selectionEnd) + 1;
    return {
      startAt: dateFromHour(selectedDay, startHour),
      endAt: dateFromHour(selectedDay, endHour),
      label: `${format(dateFromHour(selectedDay, startHour), "MMM d, h:mm a")} - ${format(
        dateFromHour(selectedDay, endHour),
        "h:mm a"
      )}`
    };
  }, [selectionEnd, selectionStart, selectedDay]);

  const selectedDayBlocks = availabilityBlocks.filter((block) => isSameCalendarDay(block.startAt, selectedDay));
  const selectedDayEvents = events.filter((event) => isSameCalendarDay(event.startAt, selectedDay));
  const availabilityAction = createAvailabilityAction.bind(null, timelineId);
  const eventAction = createEventAction.bind(null, timelineId);

  function startSelection(hour: number) {
    setSelectionStart(hour);
    setSelectionEnd(hour);
    setIsDragging(true);
  }

  function continueSelection(hour: number) {
    if (isDragging) {
      setSelectionEnd(hour);
    }
  }

  function endSelection() {
    setIsDragging(false);
  }

  return (
    <section className="calendar-workspace" onMouseUp={endSelection}>
      <div className="month-panel panel">
        <div className="calendar-toolbar">
          <button className="secondary-button" type="button" onClick={() => setVisibleMonth(subMonths(visibleMonth, 1))}>
            Prev
          </button>
          <h2>{format(visibleMonth, "MMMM yyyy")}</h2>
          <button className="secondary-button" type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
            Next
          </button>
        </div>

        <div className="month-weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="month-grid">
          {monthDays.map((day) => {
            const dayBlocks = availabilityBlocks.filter((block) => isSameCalendarDay(block.startAt, day));
            const dayEvents = events.filter((event) => isSameCalendarDay(event.startAt, day));

            return (
              <button
                className={[
                  "month-cell",
                  isSameMonth(day, visibleMonth) ? "" : "outside-month",
                  isSameDay(day, selectedDay) ? "selected" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(startOfDay(day))}
              >
                <span>{format(day, "d")}</span>
                <div className="month-cell-markers">
                  {dayBlocks.slice(0, 3).map((block) => (
                    <i
                      key={block.id}
                      style={{
                        backgroundColor: block.status === "FREE" ? block.member.freeColor : block.member.busyColor
                      }}
                    />
                  ))}
                  {dayEvents.length > 0 ? <b>{dayEvents.length}</b> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="day-panel panel">
        <div className="day-panel-header">
          <div>
            <p className="eyebrow">Selected day</p>
            <h2>{format(selectedDay, "EEEE, MMMM d")}</h2>
          </div>
          {selectedRange ? <strong>{selectedRange.label}</strong> : null}
        </div>

        <div className="hourly-grid">
          {hours.map((hour) => {
            const slotStart = dateFromHour(selectedDay, hour);
            const slotEnd = dateFromHour(selectedDay, hour + 1);
            const slotBlocks = availabilityBlocks.filter((block) => overlaps(block.startAt, block.endAt, slotStart, slotEnd));
            const slotEvents = events.filter((event) => overlaps(event.startAt, event.endAt, slotStart, slotEnd));
            const selected =
              selectedRange &&
              slotStart >= selectedRange.startAt &&
              slotStart < selectedRange.endAt;

            return (
              <div
                className={selected ? "hour-slot selected" : "hour-slot"}
                key={hour}
                role="button"
                tabIndex={0}
                onMouseDown={() => startSelection(hour)}
                onMouseEnter={() => continueSelection(hour)}
                onClick={() => {
                  setSelectionStart(hour);
                  setSelectionEnd(hour);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectionStart(hour);
                    setSelectionEnd(hour);
                  }
                }}
              >
                <span>{format(slotStart, "ha")}</span>
                <div className="slot-items">
                  {slotBlocks.map((block) => (
                    <em
                      key={block.id}
                      style={{
                        borderColor: block.status === "FREE" ? block.member.freeColor : block.member.busyColor
                      }}
                    >
                      {block.member.displayName} {block.status.toLowerCase()}
                    </em>
                  ))}
                  {slotEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/t/${timelineId}/event/${event.id}`}
                      onMouseDown={(eventClick) => eventClick.stopPropagation()}
                      onClick={(eventClick) => eventClick.stopPropagation()}
                    >
                      {event.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="selection-panel panel">
        <div>
          <p className="eyebrow">Create</p>
          <h2>{selectedRange ? selectedRange.label : "Select a time range"}</h2>
        </div>

        <div className="segmented">
          <label>
            <input
              type="radio"
              name="calendarMode"
              checked={mode === "availability"}
              onChange={() => setMode("availability")}
            />
            Free/busy
          </label>
          <label>
            <input type="radio" name="calendarMode" checked={mode === "event"} onChange={() => setMode("event")} />
            Event
          </label>
        </div>

        {mode === "availability" ? (
          <form className="form-stack" action={availabilityAction}>
            <input type="hidden" name="startAt" value={selectedRange ? inputValue(selectedRange.startAt) : ""} />
            <input type="hidden" name="endAt" value={selectedRange ? inputValue(selectedRange.endAt) : ""} />
            <div className="segmented">
              <label>
                <input name="status" type="radio" value="FREE" defaultChecked />
                Free
              </label>
              <label>
                <input name="status" type="radio" value="BUSY" />
                Busy
              </label>
            </div>
            <label>
              Note
              <input name="note" type="text" maxLength={160} />
            </label>
            <button type="submit" disabled={!selectedRange}>
              Add range
            </button>
          </form>
        ) : (
          <form className="form-stack" action={eventAction}>
            <input type="hidden" name="startAt" value={selectedRange ? inputValue(selectedRange.startAt) : ""} />
            <input type="hidden" name="endAt" value={selectedRange ? inputValue(selectedRange.endAt) : ""} />
            <label>
              Title
              <input name="title" type="text" required maxLength={120} />
            </label>
            <label>
              Location
              <input name="location" type="text" maxLength={200} />
            </label>
            <label>
              Description
              <textarea name="description" rows={4} maxLength={2000} />
            </label>
            <button type="submit" disabled={!selectedRange}>
              Create event
            </button>
          </form>
        )}

        <div className="day-summary">
          <h3>On this day</h3>
          {selectedDayBlocks.length === 0 && selectedDayEvents.length === 0 ? <p>No items yet.</p> : null}
          {selectedDayBlocks.map((block) => (
            <p key={block.id}>
              <strong>{block.member.displayName}</strong> {block.status.toLowerCase()}{" "}
              {format(eventDate(block.startAt), "h:mm a")} - {format(eventDate(block.endAt), "h:mm a")}
            </p>
          ))}
          {selectedDayEvents.map((event) => (
            <p key={event.id}>
              <Link href={`/t/${timelineId}/event/${event.id}`}>{event.title}</Link>{" "}
              {format(eventDate(event.startAt), "h:mm a")} - {format(eventDate(event.endAt), "h:mm a")}
            </p>
          ))}
        </div>
      </aside>
    </section>
  );
}
