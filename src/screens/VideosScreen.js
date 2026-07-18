import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Badge,
  Chip,
  IconButton,
  Text,
} from "react-native-paper";
import { WebView } from "react-native-webview";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../config/firebase";
import * as ScreenOrientation from "expo-screen-orientation";
import { AppContext } from "../context/AppContext";
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import {
  formatDuration,
  formatPublishedDate,
  getVideoCategories,
  subscribeToVideos,
} from "../services/videoService";
import { sendReplyNotification } from "../services/notificationService";
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";

const { width } = Dimensions.get("window");
const SEEN_VIDEO_IDS_STORAGE_KEY = "seenVideoIds:v1";

const isVideoFree = (video) => {
  if (!video) return false;
  return (
    video.title === "Nutrition: Overview and Protein" ||
    video.title === "Nutrition: Overview" ||
    video.title === "Protein"
  );
};

const FreeLabel = () => {
  const { styles, colors } = useThemedStyles(createStyles);

  return <Badge style={styles.freeBadge}>FREE</Badge>;
};

const pdfViewerHtml = (pdfUrl, colors = {}) => {
  const bg = colors.surfaceSecondary || "#f3f4f6";
  const pageBg = colors.surfacePrimary || "#fff";
  const text = colors.textSecondary || "#4b5563";
  const fab = colors.primary || "#6B21A8";
  const fabActive = colors.primaryDark || "#581C87";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>PDF Viewer</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: ${bg};
      display: flex;
      flex-direction: column;
      align-items: center;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    #viewer-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 10px;
      padding-bottom: 30px;
    }
    .page-container {
      width: 92%;
      max-width: 800px;
      margin: 8px 0;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      background-color: ${pageBg};
      border-radius: 6px;
      overflow: hidden;
    }
    canvas {
      display: block;
      width: 100% !important;
      height: auto !important;
    }
    #loading {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin-top: 60px;
      color: ${text};
      font-size: 15px;
      font-weight: 500;
      text-align: center;
    }
    .fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: ${fab};
      color: white;
      border: none;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      transition: background-color 0.2s, transform 0.1s;
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    .fab:active {
      background-color: ${fabActive};
      transform: scale(0.95);
    }
    .fab-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
  </style>
</head>
<body>
  <div id="loading">Loading notes...</div>
  <div id="viewer-container"></div>
  
  <button id="download-fab" class="fab" onclick="downloadPdf()">
    <svg class="fab-icon" viewBox="0 0 24 24">
      <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
    </svg>
  </button>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    const url = '${pdfUrl}';
    const container = document.getElementById('viewer-container');
    const loading = document.getElementById('loading');

    function downloadPdf() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'download', url: url }));
      } else {
        window.open(url, '_blank');
      }
    }

    pdfjsLib.getDocument(url).promise.then(pdf => {
      loading.style.display = 'none';
      
      let renderPage = (pageNum) => {
        if (pageNum > pdf.numPages) return;

        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container';
        container.appendChild(pageContainer);

        const canvas = document.createElement('canvas');
        pageContainer.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        pdf.getPage(pageNum).then(page => {
          const viewport = page.getViewport({ scale: 2.0 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: ctx,
            viewport: viewport
          };
          page.render(renderContext).promise.then(() => {
            renderPage(pageNum + 1);
          });
        });
      };

      renderPage(1);

    }).catch(err => {
      loading.innerText = 'Failed to load notes. Please try again.';
      console.error(err);
    });
  </script>
</body>
</html>
`;
};

const onShouldStartLoadWithRequest = (request) => {
  const url = request.url;
  if (
    url === "about:blank" || 
    url.startsWith("blob:") || 
    url.startsWith("data:") || 
    url.includes("cdnjs.cloudflare.com") ||
    url.includes("firebasestorage.googleapis.com") ||
    url.includes("storage.googleapis.com")
  ) {
    return true;
  }
  return false;
};

/**
 * Pure Bunny Stream embed URL for WebView.
 * Load the embed as the WebView document (not a nested HTML→iframe shell) so
 * the player can preload media and start without a long black gap after Play.
 */
const buildBunnyEmbedUrl = (embedUrl) => {
  try {
    const parsed = new URL(String(embedUrl || ""));
    // Buffer while the poster is visible so play can start immediately.
    parsed.searchParams.set("preload", "true");
    // Keep playback inside the WebView on mobile (faster first frame).
    parsed.searchParams.set("playsinline", "true");
    parsed.searchParams.set("disableIosPlayer", "true");
    return parsed.toString();
  } catch (_err) {
    return String(embedUrl || "");
  }
};

const getThumbnailSource = (thumbnailUrl) => {
  if (!thumbnailUrl) return null;

  if (thumbnailUrl.includes(".b-cdn.net/")) {
    return {
      uri: thumbnailUrl,
      headers: { Referer: "https://player.mediadelivery.net/" },
    };
  }

  return { uri: thumbnailUrl };
};

const EmptyState = ({ isFiltered }) => {
  const { styles, colors } = useThemedStyles(createStyles);
  return (
    <View style={styles.emptyState}>
      <MaterialIcons
        name="video-library"
        size={48}
        color={colors.textPlaceholder}
      />
      <Text style={styles.emptyTitle}>
        {isFiltered ? "No videos in this category" : "No videos yet"}
      </Text>
      <Text style={styles.emptyText}>
        {isFiltered
          ? "Choose another category or pull to refresh."
          : "New teaching videos will appear here as soon as they are synced."}
      </Text>
    </View>
  );
};

const getDoubtTime = (createdAt) => {
  if (!createdAt) return 0;
  if (typeof createdAt.toDate === "function") {
    try {
      return createdAt.toDate().getTime();
    } catch (e) {}
  }
  if (createdAt.seconds !== undefined) {
    return createdAt.seconds * 1000;
  }
  if (createdAt._seconds !== undefined) {
    return createdAt._seconds * 1000;
  }
  const t = new Date(createdAt).getTime();
  return isNaN(t) ? 0 : t;
};

const VideosScreen = ({ navigation }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const { isPremium, user, studyScore, setStudyScore } = useContext(AppContext);
  const [videos, setVideos] = useState([]);
  
  const [doubts, setDoubts] = useState([]);
  const [newDoubtText, setNewDoubtText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const [activeTab, setActiveTab] = useState("doubts");
  const [fullscreenPdf, setFullscreenPdf] = useState(false);
  const [pdfOpenedFromList, setPdfOpenedFromList] = useState(false);
  const [playerFullscreen, setPlayerFullscreen] = useState(false);
  const [seenVideoIds, setSeenVideoIds] = useState({});
  const [windowSize, setWindowSize] = useState(() => Dimensions.get("window"));

  const isLandscape = windowSize.width > windowSize.height;
  // Device landscape always expands the player so rotation feels natural.
  const effectivePlayerFullscreen = playerFullscreen || isLandscape;

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowSize(window);
    });
    return () => subscription?.remove?.();
  }, []);

  // Allow free rotation only while a video is open; re-lock portrait afterward.
  // Requires a native build with app.json orientation "default" (not OTA-only).
  useEffect(() => {
    let cancelled = false;

    const applyOrientation = async () => {
      try {
        if (selectedVideo) {
          await ScreenOrientation.unlockAsync();
        } else {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP,
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.warn(
            "Failed to update screen orientation:",
            error?.message,
          );
        }
      }
    };

    applyOrientation();

    return () => {
      cancelled = true;
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
    };
  }, [selectedVideo]);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(SEEN_VIDEO_IDS_STORAGE_KEY)
      .then((storedIds) => {
        if (!mounted || !storedIds) return;
        const parsedIds = JSON.parse(storedIds);
        if (parsedIds && typeof parsedIds === "object" && !Array.isArray(parsedIds)) {
          setSeenVideoIds(parsedIds);
        }
      })
      .catch((error) => {
        console.warn("Failed to load seen video IDs:", error?.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const markVideoSeen = (videoId) => {
    if (!videoId) return;

    setSeenVideoIds((previousIds) => {
      if (previousIds[videoId]) return previousIds;

      const nextIds = {
        ...previousIds,
        [videoId]: true,
      };

      AsyncStorage.setItem(SEEN_VIDEO_IDS_STORAGE_KEY, JSON.stringify(nextIds)).catch(
        (error) => {
          console.warn("Failed to save seen video ID:", error?.message);
        },
      );

      return nextIds;
    });
  };

  useEffect(() => {
    setActiveTab("doubts");
    setFullscreenPdf(false);
    setPdfOpenedFromList(false);
    setPlayerFullscreen(false);
  }, [selectedVideo]);

  useEffect(() => {
    if ((selectedVideo?.hasPdf && activeTab === "notes") || fullscreenPdf) {
      enableScreenCaptureProtection();
    } else {
      disableScreenCaptureProtection();
    }
    return () => {
      disableScreenCaptureProtection();
    };
  }, [activeTab, fullscreenPdf, selectedVideo]);

  const handleCloseFullscreenPdf = () => {
    setFullscreenPdf(false);
    if (pdfOpenedFromList) {
      setSelectedVideo(null);
      setPdfOpenedFromList(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (selectedVideo?.pdfUrl) {
      try {
        const supported = await Linking.canOpenURL(selectedVideo.pdfUrl);
        if (supported) {
          await Linking.openURL(selectedVideo.pdfUrl);
        } else {
          Alert.alert("Error", "Cannot open download link on this device.");
        }
      } catch (error) {
        console.error("Failed to download PDF:", error);
        Alert.alert("Error", "Failed to open download link.");
      }
    } else {
      Alert.alert("Error", "No PDF file available for download.");
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "download" && data.url) {
        Linking.openURL(data.url);
      }
    } catch (err) {
      console.error("WebView message error:", err);
    }
  };

  const closePlayerModal = () => {
    setPlayerFullscreen(false);
    setSelectedVideo(null);
  };

  const userEmail = user?.email?.toLowerCase();
  const isAdmin =
    user?.isAdmin === true ||
    userEmail === "anshuxinha@gmail.com" ||
    userEmail === "kaushikeec@gmail.com";

  useEffect(() => {
    if (!selectedVideo || !user?.uid) {
      setDoubts([]);
      setReplyingTo(null);
      setNewDoubtText("");
      return;
    }

    const snapshotsBySource = new Map();
    const publishDoubts = () => {
      const doubtsById = new Map();
      snapshotsBySource.forEach((items) => {
        items.forEach((item) => doubtsById.set(item.id, item));
      });
      const fetchedDoubts = Array.from(doubtsById.values()).sort(
        (a, b) => getDoubtTime(a.createdAt) - getDoubtTime(b.createdAt),
      );
      setDoubts(fetchedDoubts);
    };

    const syncSnapshot = (source, snapshot) => {
      snapshotsBySource.set(
        source,
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      );
      publishDoubts();
    };

    const subscribe = (source, doubtsQuery) =>
      onSnapshot(
        doubtsQuery,
        (snapshot) => syncSnapshot(source, snapshot),
        (error) => {
          console.warn("Failed to subscribe to doubts:", error?.message);
        },
      );

    const unsubscribes = isAdmin
      ? [
          subscribe(
            "admin",
            query(
              collection(db, "videoDoubts"),
              where("videoId", "==", selectedVideo.id),
            ),
          ),
        ]
      : [
          subscribe(
            "approved",
            query(
              collection(db, "videoDoubts"),
              where("videoId", "==", selectedVideo.id),
              where("status", "==", "approved"),
            ),
          ),
          subscribe(
            "mine",
            query(
              collection(db, "videoDoubts"),
              where("videoId", "==", selectedVideo.id),
              where("userId", "==", user.uid),
            ),
          ),
        ];

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [isAdmin, selectedVideo, user?.uid]);

  const visibleDoubts = useMemo(() => {
    const filtered = doubts.filter((doubt) => {
      if (isAdmin) return true;
      if (doubt.status === "approved") return true;
      if (user?.uid && doubt.userId === user.uid) return true;
      if (userEmail && doubt.userEmail?.toLowerCase() === userEmail) return true;
      return false;
    });
    return filtered;
  }, [doubts, isAdmin, user?.uid, userEmail]);

  useEffect(() => {
    if (!user?.uid || !user.pushToken) return;

    doubts
      .filter(
        (doubt) =>
          doubt.userId === user.uid &&
          doubt.authorPushToken !== user.pushToken,
      )
      .forEach((doubt) => {
        updateDoc(doc(db, "videoDoubts", doubt.id), {
          authorPushToken: user.pushToken,
        }).catch((error) => {
          console.warn("Failed to update doubt notification token:", error?.message);
        });
      });
  }, [doubts, user?.pushToken, user?.uid]);

  const handleAddDoubt = async () => {
    if (!newDoubtText.trim() || !selectedVideo) return;

    try {
      const doubtText = newDoubtText.trim();
      setNewDoubtText("");

      if (replyingTo) {
        const doubtRef = doc(db, "videoDoubts", replyingTo.id);
        const replyItem = {
          id: Math.random().toString(36).substring(2, 9),
          userId: user.uid,
          userEmail: user.email,
          username: user.username || user.displayName || "User",
          userStromaScore: studyScore,
          text: doubtText,
          createdAt: new Date().toISOString(),
          upvotedBy: [],
        };
        await updateDoc(doubtRef, {
          replies: arrayUnion(replyItem),
        });

        if (replyingTo.userId !== user.uid) {
          sendReplyNotification(replyingTo.authorPushToken, {
            replierName: replyItem.username,
            videoTitle: selectedVideo.title,
            videoId: selectedVideo.id,
            doubtId: replyingTo.id,
          });
        }

        setReplyingTo(null);
      } else {
        await addDoc(collection(db, "videoDoubts"), {
          videoId: selectedVideo.id,
          userId: user.uid,
          userEmail: user.email,
          username: user.username || user.displayName || "User",
          authorPushToken: user.pushToken || null,
          userStromaScore: studyScore,
          text: doubtText,
          status: "under_review",
          createdAt: serverTimestamp(),
          upvotedBy: [],
          replies: [],
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to post. Please try again.");
      console.error(error);
    }
  };

  const confirmDeleteDoubt = (doubt) => {
    if (!doubt?.id) return;

    Alert.alert(
      "Delete message?",
      "This will permanently remove the message and its replies.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteDoubt(doubt.id),
        },
      ],
    );
  };

  const handleDeleteDoubt = async (doubtId) => {
    try {
      await deleteDoc(doc(db, "videoDoubts", doubtId));
    } catch (error) {
      Alert.alert("Error", "Failed to delete message.");
    }
  };

  const handleDisapproveDoubt = async (doubtId) => {
    try {
      await updateDoc(doc(db, "videoDoubts", doubtId), {
        status: "under_review",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to disapprove message.");
    }
  };

  const handleApproveDoubt = async (doubtId) => {
    try {
      await updateDoc(doc(db, "videoDoubts", doubtId), {
        status: "approved",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to approve doubt.");
    }
  };

  const confirmDeleteReply = (doubt, replyId) => {
    if (!doubt?.id || !replyId) return;

    Alert.alert("Delete reply?", "This will permanently remove the reply.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteReply(doubt, replyId),
      },
    ]);
  };

  const handleDeleteReply = async (doubt, replyId) => {
    try {
      const updatedReplies = (doubt.replies || []).filter(
        (reply) => reply.id !== replyId,
      );

      await updateDoc(doc(db, "videoDoubts", doubt.id), {
        replies: updatedReplies,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to delete reply.");
    }
  };

  const handleToggleDoubtUpvote = async (doubt) => {
    if (!user?.uid) return;
    const isUpvoted = (doubt.upvotedBy || []).includes(user.uid);
    const doubtRef = doc(db, "videoDoubts", doubt.id);

    try {
      if (isUpvoted) {
        await updateDoc(doubtRef, {
          upvotedBy: arrayRemove(user.uid),
        });
      } else {
        await updateDoc(doubtRef, {
          upvotedBy: arrayUnion(user.uid),
        });
      }
    } catch (error) {
      console.warn("Failed to toggle upvote:", error?.message);
    }
  };

  const handleToggleReplyUpvote = async (doubt, replyId) => {
    if (!user?.uid) return;
    const doubtRef = doc(db, "videoDoubts", doubt.id);

    try {
      const updatedReplies = (doubt.replies || []).map((r) => {
        if (r.id === replyId) {
          const isUpvoted = (r.upvotedBy || []).includes(user.uid);
          const nextUpvotedBy = isUpvoted
            ? r.upvotedBy.filter((id) => id !== user.uid)
            : [...(r.upvotedBy || []), user.uid];

          return {
            ...r,
            upvotedBy: nextUpvotedBy,
          };
        }
        return r;
      });

      await updateDoc(doubtRef, {
        replies: updatedReplies,
      });
    } catch (error) {
      console.warn("Failed to toggle reply upvote:", error?.message);
    }
  };

  const renderDoubtItem = ({ item }) => {
    const isDoubtUpvoted = (item.upvotedBy || []).includes(user?.uid);
    const hasReplies = item.replies && item.replies.length > 0;
    const isPending = item.status === "under_review";
    const dateStr = item.createdAt ? new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).toLocaleDateString() : "Just now";
    const isOwnDoubt = user?.uid && item.userId === user.uid;
    const canDeleteDoubt = isAdmin || isOwnDoubt;
    const displayScore = isOwnDoubt ? studyScore : (item.userStromaScore || 0);

    return (
      <View style={styles.doubtItemContainer}>
        <View style={styles.doubtCard}>
          <View style={styles.doubtHeader}>
            <View style={styles.doubtAuthorInfo}>
              <Text style={styles.doubtAuthorName}>{item.username}</Text>
              <View style={styles.stromaScoreBadge}>
                <Text style={styles.stromaScoreText}>{displayScore} pts</Text>
              </View>
              {isPending && (
                <View style={styles.underReviewBadge}>
                  <Text style={styles.underReviewText}>Under Review</Text>
                </View>
              )}
            </View>
            <Text style={styles.doubtDate}>{dateStr}</Text>
          </View>
          <Text style={styles.doubtText}>{item.text}</Text>
          <View style={styles.doubtActions}>
            <Pressable
              style={[styles.actionButton, isDoubtUpvoted && styles.actionActive]}
              onPress={() => handleToggleDoubtUpvote(item)}
            >
              <MaterialIcons
                name={isDoubtUpvoted ? "thumb-up" : "thumb-up-off-alt"}
                size={16}
                color={isDoubtUpvoted ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[styles.actionButtonText, isDoubtUpvoted && styles.actionActiveText]}>
                {item.upvotedBy?.length || 0}
              </Text>
            </Pressable>
            {item.status === "approved" && (
              <Pressable
                style={styles.actionButton}
                onPress={() => setReplyingTo(item)}
              >
                <MaterialIcons name="reply" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.actionButtonText}>Reply</Text>
              </Pressable>
            )}
            {canDeleteDoubt && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => confirmDeleteDoubt(item)}
              >
                <MaterialIcons name="delete-outline" size={16} color={theme.colors.error} />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            )}
            {isAdmin && isPending && (
              <Pressable
                style={styles.approveButton}
                onPress={() => handleApproveDoubt(item.id)}
              >
                <MaterialIcons name="check-circle" size={16} color={theme.colors.success} />
                <Text style={styles.approveButtonText}>Approve</Text>
              </Pressable>
            )}
            {isAdmin && item.status === "approved" && (
              <Pressable
                style={styles.disapproveButton}
                onPress={() => handleDisapproveDoubt(item.id)}
              >
                <MaterialIcons name="visibility-off" size={16} color={theme.colors.warningText} />
                <Text style={styles.disapproveButtonText}>Disapprove</Text>
              </Pressable>
            )}
          </View>
        </View>
        {hasReplies && (
          <View style={styles.repliesContainer}>
            {item.replies.map((reply) => {
              const isReplyUpvoted = (reply.upvotedBy || []).includes(user?.uid);
              const replyDate = reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : "Just now";
              const isOwnReply = user?.uid && reply.userId === user.uid;
              const canDeleteReply = isAdmin || isOwnReply;
              const replyDisplayScore = isOwnReply ? studyScore : (reply.userStromaScore || 0);
              return (
                <View key={reply.id} style={styles.replyCard}>
                  <View style={styles.doubtHeader}>
                    <View style={styles.doubtAuthorInfo}>
                      <Text style={styles.replyAuthorName}>{reply.username}</Text>
                      <View style={styles.stromaScoreBadgeReply}>
                        <Text style={styles.stromaScoreTextReply}>{replyDisplayScore} pts</Text>
                      </View>
                    </View>
                    <Text style={styles.doubtDate}>{replyDate}</Text>
                  </View>
                  <Text style={styles.replyText}>{reply.text}</Text>
                  <View style={styles.doubtActions}>
                    <Pressable
                      style={[styles.actionButton, isReplyUpvoted && styles.actionActive]}
                      onPress={() => handleToggleReplyUpvote(item, reply.id)}
                    >
                      <MaterialIcons
                        name={isReplyUpvoted ? "thumb-up" : "thumb-up-off-alt"}
                        size={14}
                        color={isReplyUpvoted ? theme.colors.primary : theme.colors.textSecondary}
                      />
                      <Text style={[styles.actionButtonText, isReplyUpvoted && styles.actionActiveText]}>
                        {reply.upvotedBy?.length || 0}
                      </Text>
                    </Pressable>
                    {canDeleteReply && (
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => confirmDeleteReply(item, reply.id)}
                      >
                        <MaterialIcons name="delete-outline" size={14} color={theme.colors.error} />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };
  useEffect(() => {
    const unsubscribeVideos = subscribeToVideos({
      onData: (nextVideos) => {
        setVideos(nextVideos);
        setIsLoadingVideos(false);
        setIsRefreshing(false);
      },
      onError: (error) => {
        console.warn("Video subscription failed:", error?.message);
        setIsLoadingVideos(false);
        setIsRefreshing(false);
      },
    });

    return () => {
      unsubscribeVideos?.();
    };
  }, [navigation]);

  const categories = useMemo(() => getVideoCategories(videos), [videos]);

  const filteredVideos = useMemo(() => {
    let list = videos;
    if (selectedCategory !== "all") {
      list = videos.filter((video) => video.category === selectedCategory);
    }
    return list;
  }, [selectedCategory, videos]);

  const displayedVideos = useMemo(() => filteredVideos.slice(0, visibleCount), [filteredVideos, visibleCount]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 700);
  };

  const renderVideoItem = ({ item }) => {
    const duration = formatDuration(item.duration);
    const publishedAt = formatPublishedDate(item.publishedAt || item.createdAt);
    const thumbnailSource = getThumbnailSource(item.thumbnailUrl);
    const showNewBadge = item.isNew === true && !seenVideoIds[item.id];
    const showFreeBadge = !isPremium && isVideoFree(item);

    return (
      <Pressable
        style={styles.videoItem}
        onPress={() => {
          if (!isPremium && !isVideoFree(item)) {
            navigation.getParent()?.navigate("Paywall");
            return;
          }
          markVideoSeen(item.id);
          setSelectedVideo(item);
        }}
      >
        <View style={styles.videoLeft}>
          <ImageBackground
            source={thumbnailSource}
            style={styles.itemThumbnail}
            imageStyle={styles.itemThumbnailImage}
          >
            <View style={styles.itemPlayOverlay}>
              <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
            </View>
            {duration ? (
              <View style={styles.itemDurationBadge}>
                <Text style={styles.itemDurationText}>{duration}</Text>
              </View>
            ) : null}
          </ImageBackground>
        </View>
        
        <View style={styles.videoRight}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemTitle}>{item.title || "Untitled video"}</Text>
            {showNewBadge ? <Text style={styles.videoNewBadge}>NEW</Text> : null}
            {showFreeBadge ? <FreeLabel /> : null}
          </View>
          <Text style={styles.itemMeta}>
            {publishedAt}  •  {item.categoryLabel || "Lecture"}
          </Text>
        </View>

        <IconButton
          icon="dots-vertical"
          size={20}
          iconColor={theme.colors.textTertiary}
          onPress={() => {}}
          style={styles.itemOptions}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={displayedVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderVideoItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.title}>Videos</Text>
                <Text style={styles.subtitle}>
                  Recorded lectures, revisions, and case discussions.
                </Text>
              </View>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <Chip
                  selected={selectedCategory === item.id}
                  mode={selectedCategory === item.id ? "flat" : "outlined"}
                  selectedColor={theme.colors.primary}
                  style={[
                    styles.filterChip,
                    selectedCategory === item.id && styles.filterChipSelected,
                  ]}
                  textStyle={[
                    styles.filterChipText,
                    selectedCategory === item.id &&
                      styles.filterChipTextSelected,
                  ]}
                  onPress={() => setSelectedCategory(item.id)}
                  showSelectedOverlay={false}
                  icon={selectedCategory === item.id ? ({ size, color }) => (
                    <MaterialIcons name="check" size={18} color={theme.colors.primary} />
                  ) : undefined}
                >
                  {item.label}
                </Chip>
              )}
            />

            <Text style={styles.sectionHeading}>LATEST VIDEOS</Text>
          </View>
        }
        ListFooterComponent={
          visibleCount < filteredVideos.length ? (
            <Pressable 
              style={styles.loadMoreBtn} 
              onPress={() => setVisibleCount(prev => prev + 10)}
            >
              <Text style={styles.loadMoreText}>Load more</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={theme.colors.textPrimary} />
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          isLoadingVideos ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={theme.colors.secondary} />
              <Text style={styles.loadingText}>Loading videos...</Text>
            </View>
          ) : (
            <EmptyState isFiltered={selectedCategory !== "all"} />
          )
        }
      />

      <Modal
        visible={Boolean(selectedVideo)}
        animationType="slide"
        // iOS Modal defaults to portrait-only; allow landscape while video is open.
        supportedOrientations={[
          "portrait",
          "portrait-upside-down",
          "landscape",
          "landscape-left",
          "landscape-right",
        ]}
        onRequestClose={() => {
          if (playerFullscreen && !isLandscape) {
            setPlayerFullscreen(false);
            return;
          }
          closePlayerModal();
        }}
      >
        <SafeAreaView
          style={[
            styles.playerSafeArea,
            effectivePlayerFullscreen && styles.playerSafeAreaFullscreen,
          ]}
          edges={
            effectivePlayerFullscreen
              ? ["left", "right"]
              : ["top", "right", "bottom", "left"]
          }
        >
          {!effectivePlayerFullscreen && (
            <View style={styles.playerHeader}>
              <IconButton
                icon="close"
                iconColor={theme.colors.textTitle}
                onPress={closePlayerModal}
              />
              <Text style={styles.playerTitle} numberOfLines={1}>
                {selectedVideo?.title || "Video"}
              </Text>
              <IconButton
                icon="fullscreen"
                iconColor={theme.colors.textTitle}
                onPress={() => setPlayerFullscreen(true)}
              />
            </View>
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 44 : 0}
          >
            <View
              style={[
                styles.videoPlayerContainer,
                effectivePlayerFullscreen &&
                  styles.videoPlayerContainerFullscreen,
              ]}
            >
              {selectedVideo?.embedUrl ? (
                <WebView
                  // Load Bunny player as the top-level page (matches pre-gesture
                  // simplicity, without an extra HTML iframe hop that delayed start).
                  originWhitelist={["*"]}
                  source={{ uri: buildBunnyEmbedUrl(selectedVideo.embedUrl) }}
                  allowsFullscreenVideo
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsProtectedMedia
                  mixedContentMode="always"
                  setSupportMultipleWindows={false}
                  // Helps Android paint video frames instead of staying black while buffering.
                  androidLayerType="hardware"
                  style={styles.player}
                />
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons
                    name="error-outline"
                    size={42}
                    color={theme.colors.warning}
                  />
                  <Text style={styles.emptyTitle}>Video is still processing</Text>
                  <Text style={styles.emptyText}>
                    The player will appear here once Bunny finishes preparing it.
                  </Text>
                </View>
              )}
              {effectivePlayerFullscreen && (
                <View style={styles.playerFullscreenControls} pointerEvents="box-none">
                  <IconButton
                    icon="fullscreen-exit"
                    iconColor="#FFFFFF"
                    containerColor="rgba(0,0,0,0.45)"
                    onPress={() => {
                      setPlayerFullscreen(false);
                      // Landscape keeps effective fullscreen true; briefly lock
                      // portrait so the UI can shrink, then unlock for auto-rotate.
                      if (isLandscape) {
                        ScreenOrientation.lockAsync(
                          ScreenOrientation.OrientationLock.PORTRAIT_UP,
                        )
                          .catch(() => {})
                          .finally(() => {
                            setTimeout(() => {
                              if (selectedVideo) {
                                ScreenOrientation.unlockAsync().catch(() => {});
                              }
                            }, 700);
                          });
                      }
                    }}
                  />
                </View>
              )}
            </View>

            {!effectivePlayerFullscreen && selectedVideo?.hasPdf && (
              <View style={styles.tabsContainer}>
                <Pressable
                  style={[
                    styles.tabButton,
                    activeTab === "doubts" && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab("doubts")}
                >
                  <MaterialIcons
                    name="forum"
                    size={18}
                    color={
                      activeTab === "doubts"
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "doubts" && styles.activeTabButtonText,
                    ]}
                  >
                    Comments
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.tabButton,
                    activeTab === "notes" && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab("notes")}
                >
                  <MaterialIcons
                    name="description"
                    size={18}
                    color={
                      activeTab === "notes"
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "notes" && styles.activeTabButtonText,
                    ]}
                  >
                    Notes
                  </Text>
                </Pressable>
              </View>
            )}

            {!effectivePlayerFullscreen &&
              (activeTab === "doubts" ? (
                <>
                  <FlatList
                    style={styles.doubtsList}
                    data={visibleDoubts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDoubtItem}
                    contentContainerStyle={styles.doubtsListContent}
                    ListEmptyComponent={
                      <View style={styles.emptyDoubts}>
                        <MaterialIcons
                          name="forum"
                          size={40}
                          color={theme.colors.textPlaceholder}
                        />
                        <Text style={styles.emptyDoubtsTitle}>
                          No comments yet
                        </Text>
                        <Text style={styles.emptyDoubtsText}>
                          Be the first to add a comment or query about this
                          video!
                        </Text>
                      </View>
                    }
                  />

                  {replyingTo && (
                    <View style={styles.replyBanner}>
                      <Text style={styles.replyBannerText} numberOfLines={1}>
                        Replying to{" "}
                        <Text style={{ fontWeight: "bold" }}>
                          {replyingTo.username}
                        </Text>
                      </Text>
                      <IconButton
                        icon="close"
                        size={16}
                        iconColor={theme.colors.textSecondary}
                        onPress={() => setReplyingTo(null)}
                        style={{ margin: 0 }}
                      />
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={newDoubtText}
                      onChangeText={setNewDoubtText}
                      placeholder={
                        replyingTo
                          ? "Type your reply..."
                          : "Add a comment about this video..."
                      }
                      placeholderTextColor={theme.colors.textPlaceholder}
                      multiline
                    />
                    <IconButton
                      icon="send"
                      iconColor={
                        newDoubtText.trim()
                          ? theme.colors.primary
                          : theme.colors.textPlaceholder
                      }
                      disabled={!newDoubtText.trim()}
                      onPress={handleAddDoubt}
                      size={24}
                      style={styles.sendButton}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.notesTabContent}>
                  <View style={styles.notesTabHeader}>
                    <Text style={styles.notesTabTitle} numberOfLines={1}>
                      {selectedVideo?.pdfName || "Reference Notes"}
                    </Text>
                    <IconButton
                      icon="download"
                      size={24}
                      iconColor={theme.colors.primary}
                      onPress={handleDownloadPdf}
                      style={{ marginRight: 8 }}
                    />
                    <IconButton
                      icon="fullscreen"
                      size={24}
                      iconColor={theme.colors.primary}
                      onPress={() => setFullscreenPdf(true)}
                      style={styles.fullscreenIcon}
                    />
                  </View>
                  <View style={styles.pdfPreviewContainer}>
                    <WebView
                      originWhitelist={["*"]}
                      source={{ html: pdfViewerHtml(selectedVideo?.pdfUrl, colors) }}
                      style={styles.pdfWebView}
                      onShouldStartLoadWithRequest={
                        onShouldStartLoadWithRequest
                      }
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      startInLoadingState={true}
                      onMessage={handleWebViewMessage}
                      renderLoading={() => (
                        <View style={styles.pdfLoadingContainer}>
                          <ActivityIndicator
                            color={theme.colors.primary}
                            size="large"
                          />
                        </View>
                      )}
                    />
                  </View>
                </View>
              ))}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={fullscreenPdf}
        animationType="slide"
        onRequestClose={handleCloseFullscreenPdf}
      >
        <SafeAreaView style={styles.pdfFullscreenSafeArea}>
          <View style={styles.pdfFullscreenHeader}>
            <IconButton
              icon="arrow-left"
              iconColor={theme.colors.textTitle}
              onPress={handleCloseFullscreenPdf}
            />
            <Text style={styles.pdfFullscreenTitle} numberOfLines={1}>
              {selectedVideo?.pdfName || "Notes"}
            </Text>
            <IconButton
              icon="download"
              iconColor={theme.colors.primary}
              onPress={handleDownloadPdf}
            />
          </View>

          <WebView
            originWhitelist={["*"]}
            source={{ html: pdfViewerHtml(selectedVideo?.pdfUrl, colors) }}
            style={styles.pdfFullscreenWebView}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onMessage={handleWebViewMessage}
            renderLoading={() => (
              <View style={styles.pdfLoadingContainer}>
                <ActivityIndicator
                  color={theme.colors.primary}
                  size="large"
                />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  listContent: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
    gap: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.textTitle,
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 260,
  },
  categoryList: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: colors.surfacePrimary,
    borderColor: colors.border,
    borderRadius: 20,
  },
  filterChipSelected: {
    backgroundColor: colors.primaryLight, // Light purple background
    borderColor: colors.primary,
    borderWidth: 1,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  filterChipTextSelected: {
    color: colors.primary,
    fontWeight: "bold",
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 1,
    marginTop: 10,
  },
  videoItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    gap: 16,
  },
  videoLeft: {
    width: 110,
    aspectRatio: 1.2,
  },
  itemThumbnail: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  itemThumbnailImage: {
    borderRadius: 12,
    backgroundColor: colors.primaryDark, // Dark purple base
  },
  itemPlayOverlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(17, 24, 39, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  itemDurationBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  itemDurationText: {
    // Always light text on the dark badge so duration stays readable in dark mode
    // (surfacePrimary becomes dark in dark theme and would vanish on rgba(0,0,0,0.75)).
    color: colors.buttonText,
    fontSize: 10,
    fontWeight: "800",
  },
  videoRight: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 6,
  },
  itemTitle: {
    color: colors.textTitle,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    flexShrink: 1,
  },
  videoNewBadge: {
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    borderRadius: 6,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "900",
  },
  itemMeta: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: "500",
  },
  itemOptions: {
    margin: 0,
    marginRight: -8,
  },
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 4,
  },
  loadMoreText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 56,
  },
  emptyTitle: {
    marginTop: 12,
    color: colors.textTitle,
    fontWeight: "800",
    fontSize: 18,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  playerSafeArea: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  playerSafeAreaFullscreen: {
    backgroundColor: colors.textTitle,
  },
  playerHeader: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfacePrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  playerTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.textTitle,
    fontWeight: "800",
  },
  playerHeaderSpacer: {
    width: 48,
  },
  player: {
    flex: 1,
    backgroundColor: colors.textTitle,
  },
  videoPlayerContainer: {
    width: "100%",
    height: width * (9 / 16),
    backgroundColor: colors.textTitle,
  },
  videoPlayerContainerFullscreen: {
    flex: 1,
    height: "100%",
    width: "100%",
  },
  playerFullscreenControls: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  doubtsList: {
    flex: 1,
  },
  doubtsListContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  doubtItemContainer: {
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  doubtCard: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceSecondary,
  },
  doubtHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  doubtAuthorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  doubtAuthorName: {
    fontWeight: "bold",
    fontSize: 14,
    color: colors.textTitle,
  },
  stromaScoreBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stromaScoreText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "600",
  },
  underReviewBadge: {
    backgroundColor: colors.warningBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.warning,
  },
  underReviewText: {
    color: colors.warningText,
    fontSize: 11,
    fontWeight: "bold",
  },
  doubtDate: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  doubtText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  doubtActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  actionActive: {
    backgroundColor: colors.primaryLight,
  },
  actionButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionActiveText: {
    color: colors.primary,
    fontWeight: "bold",
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.successSoft,
    borderRadius: 6,
  },
  approveButtonText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "bold",
  },
  disapproveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.warningBackground,
    borderRadius: 6,
  },
  disapproveButtonText: {
    fontSize: 12,
    color: colors.warningText,
    fontWeight: "bold",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.errorLight,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: "bold",
  },
  repliesContainer: {
    marginLeft: 20,
    marginTop: 4,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.surfaceSecondary,
    paddingLeft: 12,
  },
  replyCard: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: colors.surfaceSecondary,
  },
  replyAuthorName: {
    fontWeight: "600",
    fontSize: 13,
    color: colors.textTitle,
  },
  stromaScoreBadgeReply: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  stromaScoreTextReply: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "500",
  },
  replyText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  emptyDoubts: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyDoubtsTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textTitle,
    marginTop: 8,
  },
  emptyDoubtsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSecondary,
    backgroundColor: colors.surfacePrimary,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sendButton: {
    margin: 0,
  },
  replyBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  replyBannerText: {
    fontSize: 12,
    color: colors.primary,
  },
  videoActionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemDocIcon: {
    margin: 0,
    marginRight: -4,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfacePrimary,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: "bold",
  },
  notesTabContent: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  notesTabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  notesTabTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textTitle,
    flex: 1,
    marginRight: 8,
  },
  fullscreenIcon: {
    margin: 0,
  },
  pdfPreviewContainer: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  pdfWebView: {
    flex: 1,
  },
  pdfLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  pdfFullscreenSafeArea: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  pdfFullscreenHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  pdfFullscreenTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.textTitle,
    fontWeight: "bold",
    fontSize: 16,
  },
  pdfFullscreenWebView: {
    flex: 1,
  },
  freeBadge: {
    backgroundColor: colors.success,
    color: colors.surfacePrimary,
    fontWeight: "700",
    marginRight: 6,
    alignSelf: "center",
  },
});

export default VideosScreen;
