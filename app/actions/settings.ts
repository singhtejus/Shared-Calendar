"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

import { requireTimelineMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function setTimelineFeedEnabledAction(timelineId: string, enabled: boolean) {
  const { membership } = await requireTimelineMember(timelineId);

  await prisma.timelineMember.update({
    where: { id: membership.id },
    data: enabled
      ? {
          timelineFeedEnabled: true,
          timelineFeedToken: membership.timelineFeedToken ?? randomBytes(24).toString("base64url")
        }
      : {
          timelineFeedEnabled: false,
          timelineFeedToken: null
        }
  });

  revalidatePath(`/t/${timelineId}`);
}
