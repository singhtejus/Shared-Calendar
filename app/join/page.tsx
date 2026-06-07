import Link from "next/link";

import { JoinTimelineForm } from "@/components/TimelineForms";

type JoinPageProps = {
  searchParams: Promise<{
    timeline?: string;
    redirect?: string;
  }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;

  return (
    <div className="page narrow-page">
      <div className="page-heading">
        <p className="eyebrow">Existing timeline</p>
        <h1>Join a timeline</h1>
        <p>Enter your login name and the timeline name.</p>
      </div>
      <JoinTimelineForm timeline={params.timeline} redirectTo={params.redirect} />
      <p className="helper-text">
        Starting fresh? <Link href="/create">Create a timeline.</Link>
      </p>
    </div>
  );
}
