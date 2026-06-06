"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

import { requireTimelineMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema, formEntries } from "@/lib/validators";

async function eventWithMembership(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new Error("Event not found.");
  }

  const context = await requireTimelineMember(event.timelineId);
  return { event, ...context };
}

export async function createEventAction(timelineId: string, formData: FormData) {
  const { user } = await requireTimelineMember(timelineId);
  const parsed = eventSchema.safeParse(formEntries(formData));

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid event details.");
  }

  await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        timelineId,
        createdById: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        startAt: parsed.data.startAt,
        endAt: parsed.data.endAt
      }
    });

    await tx.eventSubscription.create({
      data: {
        eventId: event.id,
        userId: user.id
      }
    });
  });

  revalidatePath(`/t/${timelineId}`);
}

export async function subscribeToEventAction(eventId: string) {
  const { event, user } = await eventWithMembership(eventId);

  await prisma.eventSubscription.upsert({
    where: {
      eventId_userId: {
        eventId,
        userId: user.id
      }
    },
    update: {},
    create: {
      eventId,
      userId: user.id
    }
  });

  revalidatePath(`/t/${event.timelineId}`);
  revalidatePath(`/t/${event.timelineId}/event/${eventId}`);
}

export async function unsubscribeFromEventAction(eventId: string) {
  const { event, user } = await eventWithMembership(eventId);

  await prisma.eventSubscription.deleteMany({
    where: {
      eventId,
      userId: user.id
    }
  });

  revalidatePath(`/t/${event.timelineId}`);
  revalidatePath(`/t/${event.timelineId}/event/${eventId}`);
}

export async function createEventShareLinkAction(eventId: string) {
  const { event, user } = await eventWithMembership(eventId);
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.eventShareLink.create({
    data: {
      eventId,
      token,
      expiresAt,
      createdById: user.id
    }
  });

  revalidatePath(`/t/${event.timelineId}/event/${eventId}`);
}
