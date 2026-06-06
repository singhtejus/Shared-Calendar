import Link from "next/link";

import { CreateTimelineForm } from "@/components/TimelineForms";

export default function CreatePage() {
  return (
    <div className="page narrow-page">
      <div className="page-heading">
        <p className="eyebrow">New timeline</p>
        <h1>Create a Timeshare timeline</h1>
        <p>Set a shared password and invite your group with the timeline id or slug.</p>
      </div>
      <CreateTimelineForm />
      <p className="helper-text">
        Already have a timeline? <Link href="/join">Join it instead.</Link>
      </p>
    </div>
  );
}
