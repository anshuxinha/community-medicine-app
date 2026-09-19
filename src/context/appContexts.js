import { createContext, useContext } from "react";

export const AppContext = createContext(null);
export const SessionContext = createContext(null);
export const LearningContext = createContext(null);

export function useSession() {
  const session = useContext(SessionContext);
  const merged = useContext(AppContext);
  return session || merged || {};
}

export function useLearning() {
  const learning = useContext(LearningContext);
  const merged = useContext(AppContext);
  return learning || merged || {};
}
