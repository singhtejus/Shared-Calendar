"use server";

import bcrypt from "bcryptjs";
import { TimelineRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { colorsForMemberIndex } from "@/lib/colors";
import { prisma } from "@/lib/prisma";
import { setUserSession } from "@/lib/auth";
import { createTimelineSchema, formEntries, joinTimelineSchema } from "@/lib/validators";

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

export async function createTimelineAction(formData: FormData) {
  const parsed = createTimelineSchema.safeParse(formEntries(formData));

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid timeline details.");
  }

  const { email, displayName, timelineName, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  const slug = await uniqueSlug(timelineName);
  const colors = colorsForMemberIndex(0);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: {
        name: displayName ?? undefined
      },
      create: {
        email,
        name: displayName
      }
    });

    const timeline = await tx.timeline.create({
      data: {
        name: timelineName,
        slug,
        passwordHash,
        createdById: user.id
      }
    });

    await tx.timelineMember.create({
      data: {
        timelineId: timeline.id,
        userId: user.id,
        role: TimelineRole.OWNER,
        displayName: displayName ?? user.name ?? email,
        freeColor: colors.freeColor,
        busyColor: colors.busyColor
      }
    });

    return { user, timeline };
  });

  await setUserSession(result.user.id);
  redirect(`/t/${result.timeline.id}`);
}

export async function joinTimelineAction(formData: FormData) {
  const parsed = joinTimelineSchema.safeParse(formEntries(formData));

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid join details.");
  }

  const { email, displayName, timelineIdentifier, password, redirectTo } = parsed.data;
  const timeline = await prisma.timeline.findFirst({
    where: {
      OR: [{ id: timelineIdentifier }, { slug: timelineIdentifier.toLowerCase() }]
    }
  });

  if (!timeline) {
    throw new Error("Timeline not found.");
  }

  const passwordMatches = await bcrypt.compare(password, timeline.passwordHash);
  if (!passwordMatches) {
    throw new Error("Timeline password is incorrect.");
  }

  const user = await prisma.$transaction(async (tx) => {
    const joinedUser = await tx.user.upsert({
      where: { email },
      update: {
        name: displayName ?? undefined
      },
      create: {
        email,
        name: displayName
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
      if (displayName && displayName !== existingMember.displayName) {
        await tx.timelineMember.update({
          where: { id: existingMember.id },
          data: { displayName }
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
        displayName: displayName ?? joinedUser.name ?? email,
        freeColor: colors.freeColor,
        busyColor: colors.busyColor
      }
    });

    return joinedUser;
  });

  await setUserSession(user.id);
  redirect(safeRedirectPath(redirectTo, `/t/${timeline.id}`));
}
