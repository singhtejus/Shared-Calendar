import { TimelineRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "timeshare_user";
const SESSION_DAYS = 30;

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId }
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/join");
  return user;
}

export async function setUserSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireTimelineMember(timelineId: string) {
  const user = await requireCurrentUser();
  const membership = await prisma.timelineMember.findUnique({
    where: {
      timelineId_userId: {
        timelineId,
        userId: user.id
      }
    },
    include: {
      timeline: true,
      user: true
    }
  });

  if (!membership) {
    redirect(`/join?timeline=${encodeURIComponent(timelineId)}`);
  }

  return { user, membership };
}

export async function requireTimelineOwner(timelineId: string) {
  const context = await requireTimelineMember(timelineId);

  if (context.membership.role !== TimelineRole.OWNER) {
    redirect(`/t/${timelineId}`);
  }

  return context;
}
