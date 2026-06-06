import { AvailabilityForm } from "@/components/AvailabilityForm";
import { CalendarGrid } from "@/components/CalendarGrid";
import { EventForm } from "@/components/EventForm";
import { FeedSettings } from "@/components/FeedSettings";
import { requireTimelineMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TimelinePageProps = {
  params: Promise<{ timelineId: string }>;
};

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { timelineId } = await params;
  const { membership } = await requireTimelineMember(timelineId);
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
          <p>Share id: <code>{timeline.id}</code></p>
          <p>Slug: <code>{timeline.slug}</code></p>
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

      <section className="two-column">
        <div>
          <h2>Add availability</h2>
          <AvailabilityForm timelineId={timeline.id} />
        </div>
        <div>
          <h2>Create event</h2>
          <EventForm timelineId={timeline.id} />
        </div>
      </section>

      <FeedSettings
        timelineId={timeline.id}
        enabled={membership.timelineFeedEnabled}
        token={membership.timelineFeedToken}
      />

      <section>
        <div className="section-heading">
          <h2>Timeline</h2>
        </div>
        <CalendarGrid availabilityBlocks={timeline.availabilityBlocks} events={timeline.events} />
      </section>
    </div>
  );
}
