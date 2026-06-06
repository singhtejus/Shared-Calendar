import { NextResponse } from "next/server";

import { generateIcs } from "@/lib/ics";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { token } = await params;
  const member = await prisma.timelineMember.findFirst({
    where: {
      timelineFeedEnabled: true,
      timelineFeedToken: token
    },
    include: {
      timeline: true,
      user: {
        include: {
          eventSubscriptions: {
            include: {
              event: true
            }
          }
        }
      }
    }
  });

  if (!member) {
    return NextResponse.json({ error: "Feed not found." }, { status: 404 });
  }

  const events = member.user.eventSubscriptions
    .map((subscription) => subscription.event)
    .filter((event) => event.timelineId === member.timelineId);

  return new Response(generateIcs(events, `${member.timeline.name} - ${member.displayName}`), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${member.timeline.slug}.ics"`
    }
  });
}
