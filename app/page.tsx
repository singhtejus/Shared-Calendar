import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page hero-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Group calendars without account sprawl</p>
          <h1>Timeshare</h1>
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
        </div>
      </section>

      <section className="feature-grid">
        <article>
          <h2>Free and busy ranges</h2>
          <p>Members mark large windows with their own timeline-specific colors.</p>
        </article>
        <article>
          <h2>Shared events</h2>
          <p>Events are visible to the timeline, and creators are subscribed automatically.</p>
        </article>
        <article>
          <h2>Private feeds</h2>
          <p>Optional ICS feeds include only the subscribed events for one member.</p>
        </article>
      </section>
    </div>
  );
}
