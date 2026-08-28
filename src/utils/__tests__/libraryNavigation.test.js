import {
  isFreeLibraryItem,
  navigateToLibraryContent,
} from "../libraryNavigation";

const mockNav = () => {
  const calls = [];
  const navigation = {
    navigate: jest.fn((...args) => calls.push(["navigate", ...args])),
    replace: jest.fn((...args) => calls.push(["replace", ...args])),
    push: jest.fn((...args) => calls.push(["push", ...args])),
  };
  return { navigation, calls };
};

describe("isFreeLibraryItem", () => {
  test("matches chapter 1 and Man and Medicine", () => {
    expect(isFreeLibraryItem({ id: "1", title: "Other" })).toBe(true);
    expect(isFreeLibraryItem({ id: 1 })).toBe(true);
    expect(isFreeLibraryItem({ id: "2", title: "Man and Medicine" })).toBe(
      true,
    );
    expect(isFreeLibraryItem({ id: "2", title: "Epidemiology" })).toBe(false);
  });
});

describe("navigateToLibraryContent", () => {
  test("sends premium users straight to Reading", () => {
    const { navigation } = mockNav();
    const params = { id: "2", title: "Epidemiology" };
    expect(
      navigateToLibraryContent(navigation, {
        isPremium: true,
        destination: "Reading",
        params,
      }),
    ).toBe("Reading");
    expect(navigation.navigate).toHaveBeenCalledWith("Reading", params);
    expect(navigation.navigate).not.toHaveBeenCalledWith(
      "PremiumGuard",
      expect.anything(),
    );
  });

  test("sends free chapters straight to Reading even without premium", () => {
    const { navigation } = mockNav();
    const params = { id: "1", title: "Man and Medicine" };
    expect(
      navigateToLibraryContent(navigation, {
        isPremium: false,
        isFree: true,
        destination: "Reading",
        params,
      }),
    ).toBe("Reading");
    expect(navigation.navigate).toHaveBeenCalledWith("Reading", params);
  });

  test("keeps PremiumGuard for paid chapters when not premium", () => {
    const { navigation } = mockNav();
    const params = { id: "5", title: "Screening" };
    expect(
      navigateToLibraryContent(navigation, {
        isPremium: false,
        destination: "Reading",
        params,
      }),
    ).toBe("PremiumGuard");
    expect(navigation.navigate).toHaveBeenCalledWith("PremiumGuard", {
      destination: "Reading",
      readingParams: params,
    });
  });

  test("pushes SubTopics directly for premium nested chapters", () => {
    const { navigation } = mockNav();
    const params = { title: "Communicable", parentId: "5", section: "theory" };
    expect(
      navigateToLibraryContent(navigation, {
        isPremium: true,
        destination: "SubTopics",
        params,
        mode: "push",
      }),
    ).toBe("SubTopics");
    expect(navigation.push).toHaveBeenCalledWith("SubTopics", params);
  });

  test("replaces Reading for next-chapter without PremiumGuard when premium", () => {
    const { navigation } = mockNav();
    const params = { id: "6", title: "NCD" };
    expect(
      navigateToLibraryContent(navigation, {
        isPremium: true,
        destination: "Reading",
        params,
        mode: "replace",
      }),
    ).toBe("Reading");
    expect(navigation.replace).toHaveBeenCalledWith("Reading", params);
  });
});
