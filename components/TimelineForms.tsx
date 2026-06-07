"use client";

import { useActionState } from "react";

import { createTimelineAction, joinTimelineAction } from "@/app/actions/timelines";

type TimelineActionState = {
  error?: string;
};

type JoinFormProps = {
  timeline?: string;
  redirectTo?: string;
};

export function CreateTimelineForm() {
  const [state, action] = useActionState<TimelineActionState, FormData>(createTimelineAction, {});

  return (
    <form className="panel form-stack" action={action}>
      <label>
        Login name
        <input name="loginName" type="text" autoComplete="name" required maxLength={80} />
      </label>
      <label>
        Timeline name
        <input name="timelineName" type="text" required maxLength={80} />
      </label>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit">Create timeline</button>
    </form>
  );
}

export function JoinTimelineForm({ timeline, redirectTo }: JoinFormProps) {
  const [state, action] = useActionState<TimelineActionState, FormData>(joinTimelineAction, {});

  return (
    <form className="panel form-stack" action={action}>
      <label>
        Login name
        <input name="loginName" type="text" autoComplete="name" required maxLength={80} />
      </label>
      <label>
        Timeline name
        <input name="timelineName" type="text" required defaultValue={timeline} maxLength={120} />
      </label>
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit">Join timeline</button>
    </form>
  );
}
