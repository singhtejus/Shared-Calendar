import { createAvailabilityAction } from "@/app/actions/availability";

type AvailabilityFormProps = {
  timelineId: string;
};

export function AvailabilityForm({ timelineId }: AvailabilityFormProps) {
  const action = createAvailabilityAction.bind(null, timelineId);

  return (
    <form className="panel form-stack" action={action}>
      <div className="segmented">
        <label>
          <input name="status" type="radio" value="FREE" defaultChecked />
          Free
        </label>
        <label>
          <input name="status" type="radio" value="BUSY" />
          Busy
        </label>
      </div>
      <label>
        Start
        <input name="startAt" type="datetime-local" required />
      </label>
      <label>
        End
        <input name="endAt" type="datetime-local" required />
      </label>
      <label>
        Note
        <input name="note" type="text" maxLength={160} />
      </label>
      <button type="submit">Add range</button>
    </form>
  );
}
