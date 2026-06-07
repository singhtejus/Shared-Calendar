import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createEventShareLinkAction,
  subscribeToEventAction,
  unsubscribeFromEventAction
} from "@/app/actions/events";
import { formatDateRange } from "@/lib/dates";
import { googleCalendarLink, getAppUrl } from "@/lib/links";
import { requireTimelineMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EventPageProps = {
  params: Promise<{
    timelineId: string;
    eventId: string;
  }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { timelineId, eventId } = await params;
  const { user } = await requireTimelineMember(timelineId);
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      timelineId
    },
    include: {
      createdBy: true,
      subscriptions: {
        include: { user: true },
        orderBy: { createdAt: "asc" }
      },
      shareLinks: {
        where: {
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });

  if (!event) notFound();

  const isSubscribed = event.subscriptions.some((subscription) => subscription.userId === user.id);
  const subscribeAction = subscribeToEventAction.bind(null, event.id);
  const unsubscribeAction = unsubscribeFromEventAction.bind(null, event.id);
  const shareAction = createEventShareLinkAction.bind(null, event.id);

  return (
    <div className="page narrow-page event-detail">
      <Link href={`/t/${timelineId}`}>&larr; Back to timeline</Link>
      <div className="page-heading">
        <p className="eyebrow">Event</p>
        <h1>{event.title}</h1>
        <p>{formatDateRange(event.startAt, event.endAt)}</p>
      </div>

      <section className="panel detail-list">
        {event.location ? (
          <div>
            <span>Location</span>
            <p>{event.location}</p>
          </div>
        ) : null}
        {event.description ? (
          <div>
            <span>Description</span>
            <p>{event.description}</p>
          </div>
        ) : null}
        <div>
          <span>Created by</span>
          <p>{event.createdBy.name ?? "Unknown member"}</p>
        </div>
        <div>
          <span>Subscribed</span>
          <p>
            {event.subscriptions.length > 0
              ? event.subscriptions
                  .map((subscription) => subscription.user.name ?? "Unknown member")
                  .join(", ")
              : "No subscribers yet"}
          </p>
        </div>
      </section>

      <section className="action-panel">
        <form action={isSubscribed ? unsubscribeAction : subscribeAction}>
          <button type="submit">{isSubscribed ? "Unsubscribe" : "Subscribe"}</button>
        </form>
        <a className="button secondary" href={`/api/event/${event.id}/ics`}>
          Download ICS
        </a>
        <a className="button secondary" href={googleCalendarLink(event)} target="_blank" rel="noreferrer">
          Add to Google Calendar
        </a>
      </section>

      <section className="panel form-stack">
        <div>
          <h2>Share link</h2>
          <p>Share links route people through the join flow before showing event details.</p>
        </div>
        <form action={shareAction}>
          <button type="submit">Create share link</button>
        </form>
        {event.shareLinks.length > 0 ? (
          <div className="share-links">
            {event.shareLinks.map((link) => (
              <code key={link.id}>{`${getAppUrl()}/share/${link.token}`}</code>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
