/**
 * Where a push tap should land.
 * Feed alerts open the dashboard and ask it to scan the updates strip.
 * Comment alerts still open Updates. Health-day alerts open the dashboard
 * without forcing a feed scan.
 */
export function destinationForNotificationData(data, nonce) {
  const screen = data?.screen;
  const isFeedPush =
    data?.type === "updates_feed" ||
    (screen === "Updates" && !data?.type && !data?.updateId);

  if (isFeedPush) {
    return {
      name: "MainTabs",
      params: {
        screen: "Dashboard",
        params: {
          awaitUpdatesFeed: true,
          awaitUpdatesFeedAt: nonce,
        },
      },
    };
  }

  if (
    screen === "Dashboard" ||
    screen === "Library" ||
    screen === "Videos" ||
    screen === "Updates"
  ) {
    return {
      name: "MainTabs",
      params: { screen },
    };
  }

  if (typeof screen === "string" && screen.length > 0) {
    return { name: screen };
  }

  return null;
}
