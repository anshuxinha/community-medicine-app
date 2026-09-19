import React, { useRef, useState } from "react";
import { Pressable, Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import {
  LearningContext,
  SessionContext,
  useLearning,
  useSession,
} from "../appContexts";

const SessionProbe = React.memo(function SessionProbe() {
  useSession();
  const count = useRef(0);
  count.current += 1;
  return <Text>{`s${count.current}`}</Text>;
});

const LearningProbe = React.memo(function LearningProbe() {
  useLearning();
  const count = useRef(0);
  count.current += 1;
  return <Text>{`l${count.current}`}</Text>;
});

function Harness() {
  const [session] = useState({ isPremium: true });
  const [learning, setLearning] = useState({ readingProgress: 0 });
  return (
    <SessionContext.Provider value={session}>
      <LearningContext.Provider value={learning}>
        <SessionProbe />
        <LearningProbe />
        <Pressable onPress={() => setLearning({ readingProgress: 1 })}>
          <Text>bump</Text>
        </Pressable>
      </LearningContext.Provider>
    </SessionContext.Provider>
  );
}

describe("session vs learning context", () => {
  it("does not re-render a session consumer when only learning changes", () => {
    const { getByText } = render(<Harness />);
    expect(getByText("s1")).toBeTruthy();
    expect(getByText("l1")).toBeTruthy();
    fireEvent.press(getByText("bump"));
    expect(getByText("s1")).toBeTruthy();
    expect(getByText("l2")).toBeTruthy();
  });
});
