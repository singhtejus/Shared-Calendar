import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { generateIcs } from "@/lib/ics";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const membership = await prisma.timelineMember.findUnique({
    where: {
      timelineId_userId: {
        timelineId: event.timelineId,
        userId: user.id
      }
    }
  });

  if (!membership) {
    return NextResponse.json({ error: "Timeline membership required." }, { status: 403 });
  }

  return new Response(generateIcs([event], event.title), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.id}.ics"`
    }
  });
}
