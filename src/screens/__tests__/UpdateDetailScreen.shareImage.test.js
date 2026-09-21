import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import UpdateDetailScreen, {
  articleShareBodyLineCount,
} from "../UpdateDetailScreen";

jest.mock("../../context/AppContext", () => ({
  useSession: () => ({ user: null, studyScore: 0 }),
}));

jest.mock("../../config/firebase", () => ({
  db: {},
  auth: { currentUser: null },
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn((_query, onNext) => {
    if (typeof onNext === "function") onNext({ forEach() {} });
    return jest.fn();
  }),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock("../../services/updatesService", () => ({
  getUpdateType: (item, fallback = "NEWS") => {
    const val = String(item?.tag || item?.type || "")
      .trim()
      .toUpperCase();
    if (val === "ARTICLE" || val === "NEWS") return val;
    return fallback;
  },
}));

jest.mock("../../services/notificationService", () => ({
  sendReplyNotification: jest.fn(),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(),
}));

jest.mock("react-native-view-shot", () => {
  const React = require("react");
  const { View } = require("react-native");
  const ViewShot = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref }, props.children),
  );
  ViewShot.displayName = "ViewShot";
  return { __esModule: true, default: ViewShot };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MaterialIcons: (props) => React.createElement(View, props),
    MaterialCommunityIcons: (props) => React.createElement(View, props),
  };
});

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const insetContext = React.createContext({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, ...props }) =>
      React.createElement("SafeAreaView", props, children),
    SafeAreaContext: insetContext,
    SafeAreaConsumer: insetContext.Consumer,
    SafeAreaInsetsContext: insetContext,
    SafeAreaInsetsConsumer: insetContext.Consumer,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

const navigation = { goBack: jest.fn(), navigate: jest.fn() };

function longBody() {
  return Array.from({ length: 400 }, (_, index) => `word${index}`).join(" ");
}

function renderUpdate(update) {
  return render(
    <PaperProvider>
      <UpdateDetailScreen route={{ params: { update } }} navigation={navigation} />
    </PaperProvider>,
  );
}

describe("articleShareBodyLineCount", () => {
  it("counts only whole lines that fit the clip", () => {
    expect(articleShareBodyLineCount(110, 22)).toBe(5);
    expect(articleShareBodyLineCount(21, 22)).toBe(0);
    expect(articleShareBodyLineCount(Number.NaN, 22)).toBe(0);
  });
});

describe("UpdateDetailScreen share image", () => {
  const summary = longBody();

  it("keeps an article share card square and truncates the body", () => {
    const { getByTestId, getAllByText, getByText } = renderUpdate({
      id: "article-1",
      title: "Iron in pregnancy",
      date: "2026-09-01",
      summary,
      source: "ICMR",
      category: "Nutrition",
      tag: "ARTICLE",
    });

    const card = StyleSheet.flatten(getByTestId("update-share-card").props.style);
    expect(card.width).toBe(440);
    expect(card.height).toBe(440);
    expect(card.overflow).toBe("hidden");

    fireEvent(getByTestId("update-share-body-clip"), "layout", {
      nativeEvent: { layout: { height: 110, width: 392 } },
    });

    const body = getByTestId("update-share-body");
    expect(body.props.numberOfLines).toBe(5);
    expect(body.props.children).toBe(summary);
    expect(getAllByText("Iron in pregnancy").length).toBeGreaterThan(0);
    expect(getByText("STROMA")).toBeTruthy();
    expect(getByText("Source: ICMR")).toBeTruthy();
  });

  it("leaves a news share card at the height of its summary", () => {
    const { getByTestId, queryByTestId } = renderUpdate({
      id: "news-1",
      title: "PIB note",
      date: "2026-09-02",
      summary: "A short news summary.",
      source: "PIB",
      tag: "NEWS",
    });

    const card = StyleSheet.flatten(getByTestId("update-share-card").props.style);
    expect(card.width).toBe(440);
    expect(card.height).toBeUndefined();
    expect(queryByTestId("update-share-body-clip")).toBeNull();
    expect(getByTestId("update-share-body").props.numberOfLines).toBeUndefined();
  });
});
