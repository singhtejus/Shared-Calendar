import { FeedSettings } from "@/components/FeedSettings";
import { TimelineCalendar } from "@/components/TimelineCalendar";
import { deleteTimelineAction } from "@/app/actions/timelines";
import { requireTimelineMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TimelinePageProps = {
  params: Promise<{ timelineId: string }>;
};

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { timelineId } = await params;
  const { membership } = await requireTimelineMember(timelineId);
  const deleteAction = deleteTimelineAction.bind(null, timelineId);
  const timeline = await prisma.timeline.findUniqueOrThrow({
    where: { id: timelineId },
    include: {
      members: {
        orderBy: { createdAt: "asc" }
      },
      availabilityBlocks: {
        include: { member: true },
        orderBy: { startAt: "asc" }
      },
      events: {
        include: { subscriptions: true },
        orderBy: { startAt: "asc" }
      }
    }
  });

  return (
    <div className="page dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Timeline</p>
          <h1>{timeline.name}</h1>
          <p>
            Share id: <code>{timeline.id}</code> Slug: <code>{timeline.slug}</code>
          </p>
        </div>
        <div className="member-legend">
          {timeline.members.map((member) => (
            <div className="legend-item" key={member.id}>
              <span style={{ backgroundColor: member.freeColor }} />
              <span style={{ backgroundColor: member.busyColor }} />
              {member.displayName}
            </div>
          ))}
        </div>
      </section>

      <TimelineCalendar
        timelineId={timeline.id}
        availabilityBlocks={timeline.availabilityBlocks.map((block) => ({
          id: block.id,
          status: block.status,
          startAt: block.startAt.toISOString(),
          endAt: block.endAt.toISOString(),
          note: block.note,
          member: {
            id: block.member.id,
            displayName: block.member.displayName,
            freeColor: block.member.freeColor,
            busyColor: block.member.busyColor
          }
        }))}
        events={timeline.events.map((event) => ({
          id: event.id,
          timelineId: event.timelineId,
          title: event.title,
          location: event.location,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt.toISOString(),
          subscriptions: event.subscriptions.map((subscription) => ({ id: subscription.id }))
        }))}
      />

      <FeedSettings
        timelineId={timeline.id}
        enabled={membership.timelineFeedEnabled}
        token={membership.timelineFeedToken}
      />

      <section className="panel danger-zone">
        <div>
          <p className="eyebrow">Danger zone</p>
          <h2>Delete timeline</h2>
          <p>
            Deletes this timeline, members, availability, events, event subscriptions, and share
            links.
          </p>
        </div>
        <form action={deleteAction}>
          <button className="danger-button" type="submit">
            Delete timeline
          </button>
        </form>
      </section>
    </div>
  );
}
