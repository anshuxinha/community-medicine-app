import { destinationForNotificationData } from "../notificationRoute";

describe("destinationForNotificationData", () => {
  it("opens the dashboard and requests a feed scan for a new-item push", () => {
    expect(
      destinationForNotificationData(
        { screen: "Dashboard", type: "updates_feed" },
        "tap-1",
      ),
    ).toEqual({
      name: "MainTabs",
      params: {
        screen: "Dashboard",
        params: {
          awaitUpdatesFeed: true,
          awaitUpdatesFeedAt: "tap-1",
        },
      },
    });
  });

  it("treats an older Updates feed push with no comment payload the same way", () => {
    const route = destinationForNotificationData({ screen: "Updates" }, 9);
    expect(route.params.screen).toBe("Dashboard");
    expect(route.params.params.awaitUpdatesFeed).toBe(true);
  });

  it("keeps comment alerts on the Updates tab", () => {
    expect(
      destinationForNotificationData({
        screen: "Updates",
        type: "admin_news_comment",
        updateId: "u1",
      }),
    ).toEqual({
      name: "MainTabs",
      params: { screen: "Updates" },
    });
  });

  it("opens the dashboard for a health-day reminder without a feed scan", () => {
    expect(
      destinationForNotificationData({ screen: "Dashboard" }, "day"),
    ).toEqual({
      name: "MainTabs",
      params: { screen: "Dashboard" },
    });
  });
});
