export const isFreeLibraryItem = (item) =>
  String(item?.id) === "1" || item?.title === "Man and Medicine";

const GUARD_PARAM_KEY = {
  Reading: "readingParams",
  SubTopics: "subTopicsParams",
};

export const navigateToLibraryContent = (
  navigation,
  {
    isPremium = false,
    isFree = false,
    destination,
    params,
    mode = "navigate",
  } = {},
) => {
  const go = navigation?.[mode];
  if (typeof go !== "function" || !destination) {
    return "invalid";
  }

  if (isFree || isPremium) {
    go.call(navigation, destination, params);
    return destination;
  }

  const paramKey = GUARD_PARAM_KEY[destination];
  const guardParams = paramKey
    ? { destination, [paramKey]: params }
    : { destination };
  go.call(navigation, "PremiumGuard", guardParams);
  return "PremiumGuard";
};
