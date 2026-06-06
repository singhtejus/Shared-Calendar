import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    const membership = await prisma.timelineMember.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { timelineId: true }
    });

    if (membership) {
      redirect(`/t/${membership.timelineId}`);
    }
  }

  return (
    <div className="page auth-home">
      <section className="simple-intro">
        <h1>Timeshare</h1>
        <p className="lede">A shared calendar for friends.</p>
        <p>
          Create one timeline for a group, collect free and busy ranges, plan events, and let each
          member subscribe only to the events they care about.
        </p>
        <div className="button-row">
          <Link className="button" href="/create">
            Create timeline
          </Link>
          <Link className="button secondary" href="/join">
            Join timeline
          </Link>
        </div>
      </section>
    </div>
  );
}
