import { setTimelineFeedEnabledAction } from "@/app/actions/settings";
import { getAppUrl } from "@/lib/links";

type FeedSettingsProps = {
  timelineId: string;
  enabled: boolean;
  token?: string | null;
};

export function FeedSettings({ timelineId, enabled, token }: FeedSettingsProps) {
  const enableAction = setTimelineFeedEnabledAction.bind(null, timelineId, true);
  const disableAction = setTimelineFeedEnabledAction.bind(null, timelineId, false);
  const feedUrl = enabled && token ? `${getAppUrl()}/api/feed/${token}` : null;
  const webcalUrl = feedUrl?.replace(/^https?:\/\//, "webcal://");

  return (
    <section className="panel feed-settings">
      <div>
        <h2>Personal feed</h2>
        <p>Contains only events you subscribed to in this timeline.</p>
      </div>
      {feedUrl ? (
        <div className="feed-url">
          <code>{feedUrl}</code>
          <div className="feed-actions">
            {webcalUrl ? (
              <a className="button" href={webcalUrl}>
                Subscribe in Calendar
              </a>
            ) : null}
            <form action={disableAction}>
              <button className="secondary-button" type="submit">
                Disable feed
              </button>
            </form>
          </div>
        </div>
      ) : (
        <form action={enableAction}>
          <button type="submit">Enable feed</button>
        </form>
      )}
    </section>
  );
}
