import { createTimelineAction, joinTimelineAction } from "@/app/actions/timelines";

type JoinFormProps = {
  timeline?: string;
  redirectTo?: string;
};

export function CreateTimelineForm() {
  return (
    <form className="panel form-stack" action={createTimelineAction}>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Display name
        <input name="displayName" type="text" autoComplete="name" />
      </label>
      <label>
        Timeline name
        <input name="timelineName" type="text" required maxLength={80} />
      </label>
      <label>
        Shared password
        <input name="password" type="password" required minLength={6} />
      </label>
      <button type="submit">Create timeline</button>
    </form>
  );
}

export function JoinTimelineForm({ timeline, redirectTo }: JoinFormProps) {
  return (
    <form className="panel form-stack" action={joinTimelineAction}>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Display name
        <input name="displayName" type="text" autoComplete="name" />
      </label>
      <label>
        Timeline id or slug
        <input name="timelineIdentifier" type="text" required defaultValue={timeline} />
      </label>
      <label>
        Shared password
        <input name="password" type="password" required minLength={6} />
      </label>
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      <button type="submit">Join timeline</button>
    </form>
  );
}
