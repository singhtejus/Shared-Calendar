import Link from "next/link";

import { formatDateRange } from "@/lib/dates";

type EventCardProps = {
  event: {
    id: string;
    timelineId: string;
    title: string;
    location?: string | null;
    startAt: Date;
    endAt: Date;
    subscriptions: { id: string }[];
  };
};

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="event-card">
      <div>
        <Link href={`/t/${event.timelineId}/event/${event.id}`}>{event.title}</Link>
        <p>{formatDateRange(event.startAt, event.endAt)}</p>
        {event.location ? <p>{event.location}</p> : null}
      </div>
      <span>{event.subscriptions.length} subscribed</span>
    </article>
  );
}
