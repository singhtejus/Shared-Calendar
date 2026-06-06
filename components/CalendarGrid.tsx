import { deleteAvailabilityAction } from "@/app/actions/availability";
import { dayKey, formatDateRange, formatDay } from "@/lib/dates";
import { EventCard } from "@/components/EventCard";

type Member = {
  id: string;
  displayName: string;
  freeColor: string;
  busyColor: string;
};

type AvailabilityBlock = {
  id: string;
  status: "FREE" | "BUSY";
  startAt: Date;
  endAt: Date;
  note?: string | null;
  member: Member;
};

type EventItem = {
  id: string;
  timelineId: string;
  title: string;
  location?: string | null;
  startAt: Date;
  endAt: Date;
  subscriptions: { id: string }[];
};

type CalendarGridProps = {
  availabilityBlocks: AvailabilityBlock[];
  events: EventItem[];
};

export function CalendarGrid({ availabilityBlocks, events }: CalendarGridProps) {
  const grouped = new Map<string, { date: Date; availability: AvailabilityBlock[]; events: EventItem[] }>();

  for (const block of availabilityBlocks) {
    const key = dayKey(block.startAt);
    const group = grouped.get(key) ?? { date: block.startAt, availability: [], events: [] };
    group.availability.push(block);
    grouped.set(key, group);
  }

  for (const event of events) {
    const key = dayKey(event.startAt);
    const group = grouped.get(key) ?? { date: event.startAt, availability: [], events: [] };
    group.events.push(event);
    grouped.set(key, group);
  }

  const days = Array.from(grouped.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

  if (days.length === 0) {
    return <div className="empty-state">No ranges or events yet.</div>;
  }

  return (
    <div className="calendar-grid">
      {days.map((day) => (
        <section className="day-group" key={dayKey(day.date)}>
          <h3>{formatDay(day.date)}</h3>
          <div className="day-items">
            {day.availability
              .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
              .map((block) => {
                const color = block.status === "FREE" ? block.member.freeColor : block.member.busyColor;
                const deleteAction = deleteAvailabilityAction.bind(null, block.id);

                return (
                  <article className="availability-card" key={block.id} style={{ borderLeftColor: color }}>
                    <div>
                      <strong>{block.member.displayName}</strong>
                      <span>{block.status === "FREE" ? "Free" : "Busy"}</span>
                      <p>{formatDateRange(block.startAt, block.endAt)}</p>
                      {block.note ? <p>{block.note}</p> : null}
                    </div>
                    <form action={deleteAction}>
                      <button className="secondary-button" type="submit">
                        Delete
                      </button>
                    </form>
                  </article>
                );
              })}
            {day.events
              .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
              .map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
