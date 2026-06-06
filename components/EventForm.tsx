import { createEventAction } from "@/app/actions/events";

type EventFormProps = {
  timelineId: string;
};

export function EventForm({ timelineId }: EventFormProps) {
  const action = createEventAction.bind(null, timelineId);

  return (
    <form className="panel form-stack" action={action}>
      <label>
        Title
        <input name="title" type="text" required maxLength={120} />
      </label>
      <label>
        Start
        <input name="startAt" type="datetime-local" required />
      </label>
      <label>
        End
        <input name="endAt" type="datetime-local" required />
      </label>
      <label>
        Location
        <input name="location" type="text" maxLength={200} />
      </label>
      <label>
        Description
        <textarea name="description" rows={4} maxLength={2000} />
      </label>
      <button type="submit">Create event</button>
    </form>
  );
}
