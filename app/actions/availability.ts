"use server";

import { TimelineRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireCurrentUser, requireTimelineMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { availabilitySchema, formEntries } from "@/lib/validators";

export async function createAvailabilityAction(timelineId: string, formData: FormData) {
  const { membership } = await requireTimelineMember(timelineId);
  const parsed = availabilitySchema.safeParse(formEntries(formData));

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid availability details.");
  }

  await prisma.availabilityBlock.create({
    data: {
      timelineId,
      memberId: membership.id,
      status: parsed.data.status,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
      note: parsed.data.note
    }
  });

  revalidatePath(`/t/${timelineId}`);
}

export async function deleteAvailabilityAction(blockId: string) {
  const user = await requireCurrentUser();
  const block = await prisma.availabilityBlock.findUnique({
    where: { id: blockId },
    include: {
      member: true
    }
  });

  if (!block) return;

  const currentMember = await prisma.timelineMember.findUnique({
    where: {
      timelineId_userId: {
        timelineId: block.timelineId,
        userId: user.id
      }
    }
  });

  if (!currentMember) return;
  if (currentMember.role !== TimelineRole.OWNER && block.member.userId !== user.id) return;

  await prisma.availabilityBlock.delete({
    where: { id: blockId }
  });

  revalidatePath(`/t/${block.timelineId}`);
}
