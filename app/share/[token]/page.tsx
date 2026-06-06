import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const shareLink = await prisma.eventShareLink.findUnique({
    where: { token },
    include: {
      event: {
        include: {
          timeline: true
        }
      }
    }
  });

  if (!shareLink) {
    return <ShareMessage title="Invalid link" body="This share link does not exist." />;
  }

  if (shareLink.expiresAt <= new Date()) {
    return <ShareMessage title="Expired link" body="This share link has expired." />;
  }

  const destination = `/t/${shareLink.event.timelineId}/event/${shareLink.eventId}`;
  const user = await getCurrentUser();

  if (user) {
    const membership = await prisma.timelineMember.findUnique({
      where: {
        timelineId_userId: {
          timelineId: shareLink.event.timelineId,
          userId: user.id
        }
      }
    });

    if (membership) redirect(destination);
  }

  redirect(
    `/join?timeline=${encodeURIComponent(shareLink.event.timeline.slug)}&redirect=${encodeURIComponent(destination)}`
  );
}

function ShareMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="page narrow-page">
      <div className="panel">
        <h1>{title}</h1>
        <p>{body}</p>
        <Link className="button" href="/join">
          Join a timeline
        </Link>
      </div>
    </div>
  );
}
