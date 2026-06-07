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
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [isDayOpen, setIsDayOpen] = useState(false);
  const dayOverlayRef = useRef<HTMLDivElement>(null);
  const hourlyGridRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (dayOverlayRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest("[data-calendar-day]")) return;

      setIsDayOpen(false);
      setIsDragging(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function openDay(day: Date) {
    setSelectedDay(startOfDay(day));
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsDragging(false);
    setIsDayOpen(true);
  }

  function startSelection(hour: number, pointerId?: number, target?: Element, pointerType?: string) {
    setSelectionStart(hour);
    setSelectionEnd(hour);
    setIsDragging(true);

    if (pointerId !== undefined && pointerType !== "mouse" && target instanceof HTMLElement) {
      target.setPointerCapture(pointerId);
    }
  }

  function continueSelectionFromPoint(clientX: number, clientY: number) {
    if (!isDragging) return;

    const target = document.elementFromPoint(clientX, clientY);
    const slot = target?.closest("[data-hour-slot]");
    const hour = slot?.getAttribute("data-hour");

    if (hour !== null && hour !== undefined) {
      setSelectionEnd(Number(hour));
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
                  isDayOpen && isSameDay(day, selectedDay) ? "selected" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={day.toISOString()}
                type="button"
                data-calendar-day
                onClick={() => openDay(day)}
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

        {isDayOpen ? (
          <div className="day-overlay" ref={dayOverlayRef}>
            <div className="day-panel panel">
              <div className="day-panel-header">
                <div>
                  <p className="eyebrow">Drag to select hours</p>
                  <h2>{format(selectedDay, "EEEE, MMMM d")}</h2>
                </div>
                <button className="secondary-button" type="button" onClick={() => setIsDayOpen(false)}>
                  Close
                </button>
              </div>
              {selectedRange ? <strong className="selected-range-label">{selectedRange.label}</strong> : null}

              <div
                className={isDragging ? "hourly-grid selecting" : "hourly-grid"}
                ref={hourlyGridRef}
                onPointerMove={(event) => {
                  if (isDragging) {
                    event.preventDefault();
                    continueSelectionFromPoint(event.clientX, event.clientY);
                  }
                }}
                onPointerUp={endSelection}
                onPointerCancel={endSelection}
              >
                {hours.map((hour) => {
                  const slotStart = dateFromHour(selectedDay, hour);
                  const slotEnd = dateFromHour(selectedDay, hour + 1);
                  const slotBlocks = availabilityBlocks.filter((block) =>
                    overlaps(block.startAt, block.endAt, slotStart, slotEnd)
                  );
                  const slotEvents = events.filter((event) => overlaps(event.startAt, event.endAt, slotStart, slotEnd));
                  const selected = selectedRange && slotStart >= selectedRange.startAt && slotStart < selectedRange.endAt;

                  return (
                    <div
                      className={selected ? "hour-slot selected" : "hour-slot"}
                      key={hour}
                      role="button"
                      tabIndex={0}
                      data-hour-slot
                      data-hour={hour}
                      onPointerDown={(event) => {
                        if (event.target instanceof Element && event.target.closest("[data-scroll-hours]")) {
                          return;
                        }

                        event.preventDefault();
                        startSelection(hour, event.pointerId, event.currentTarget, event.pointerType);
                      }}
                      onPointerMove={(event) => {
                        if (isDragging && event.pointerType === "mouse") {
                          setSelectionEnd(hour);
                        }
                      }}
                      onMouseEnter={() => {
                        if (isDragging) {
                          setSelectionEnd(hour);
                        }
                      }}
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
                      <span data-scroll-hours>{format(slotStart, "ha")}</span>
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
              <section className="create-section">
                <h2>{selectedRange ? selectedRange.label : "Select a time range"}</h2>
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
              </section>

              <section className="create-section">
                <p className="eyebrow">Create event</p>
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
                    <textarea name="description" rows={3} maxLength={2000} />
                  </label>
                  <button type="submit" disabled={!selectedRange}>
                    Add event
                  </button>
                </form>
              </section>

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
          </div>
        ) : null}
      </div>
    </section>
  );
}
