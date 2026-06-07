"use server";

import { TimelineRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { colorsForMemberIndex } from "@/lib/colors";
import { prisma } from "@/lib/prisma";
import { requireTimelineMember, setUserSession } from "@/lib/auth";
import { createTimelineSchema, formEntries, joinTimelineSchema } from "@/lib/validators";

type TimelineActionState = {
  error?: string;
};

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "timeline"
  );
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;

  while (await prisma.timeline.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function safeRedirectPath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function userKeyFromLoginName(loginName: string) {
  return `${slugify(loginName)}@timeshare.local`;
}

export async function createTimelineAction(
  _state: TimelineActionState,
  formData: FormData
): Promise<TimelineActionState> {
  const parsed = createTimelineSchema.safeParse(formEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid timeline details." };
  }

  const { loginName, timelineName } = parsed.data;
  const existingTimeline = await prisma.timeline.findFirst({
    where: {
      name: {
        equals: timelineName,
        mode: "insensitive"
      }
    },
    select: { id: true }
  });

  if (existingTimeline) {
    return { error: "A timeline with that name already exists. Pick a different name or join it." };
  }

  const email = userKeyFromLoginName(loginName);
  const slug = await uniqueSlug(timelineName);
  const colors = colorsForMemberIndex(0);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: {
        name: loginName
      },
      create: {
        email,
        name: loginName
      }
    });

    const timeline = await tx.timeline.create({
      data: {
        name: timelineName,
        slug,
        passwordHash: "",
        createdById: user.id
      }
    });

    await tx.timelineMember.create({
      data: {
        timelineId: timeline.id,
        userId: user.id,
        role: TimelineRole.OWNER,
        displayName: loginName,
        freeColor: colors.freeColor,
        busyColor: colors.busyColor
      }
    });

    return { user, timeline };
  });

  await setUserSession(result.user.id);
  redirect(`/t/${result.timeline.id}`);
}

export async function joinTimelineAction(
  _state: TimelineActionState,
  formData: FormData
): Promise<TimelineActionState> {
  const parsed = joinTimelineSchema.safeParse(formEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid join details." };
  }

  const { loginName, timelineName, redirectTo } = parsed.data;
  const timeline = await prisma.timeline.findFirst({
    where: {
      OR: [
        { id: timelineName },
        { slug: timelineName.toLowerCase() },
        {
          name: {
            equals: timelineName,
            mode: "insensitive"
          }
        }
      ]
    }
  });

  if (!timeline) {
    return { error: "Timeline not found. Check the timeline name and try again." };
  }

  const email = userKeyFromLoginName(loginName);
  const user = await prisma.$transaction(async (tx) => {
    const joinedUser = await tx.user.upsert({
      where: { email },
      update: {
        name: loginName
      },
      create: {
        email,
        name: loginName
      }
    });

    const existingMember = await tx.timelineMember.findUnique({
      where: {
        timelineId_userId: {
          timelineId: timeline.id,
          userId: joinedUser.id
        }
      }
    });

    if (existingMember) {
      if (loginName !== existingMember.displayName) {
        await tx.timelineMember.update({
          where: { id: existingMember.id },
          data: { displayName: loginName }
        });
      }

      return joinedUser;
    }

    const memberCount = await tx.timelineMember.count({
      where: { timelineId: timeline.id }
    });
    const colors = colorsForMemberIndex(memberCount);

    await tx.timelineMember.create({
      data: {
        timelineId: timeline.id,
        userId: joinedUser.id,
        displayName: loginName,
        freeColor: colors.freeColor,
        busyColor: colors.busyColor
      }
    });

    return joinedUser;
  });

  await setUserSession(user.id);
  redirect(safeRedirectPath(redirectTo, `/t/${timeline.id}`));
}

export async function deleteTimelineAction(timelineId: string) {
  await requireTimelineMember(timelineId);

  await prisma.timeline.delete({
    where: { id: timelineId }
  });

  redirect("/");
}
