import React, { useContext, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { AppContext } from "../context/AppContext";
import { useThemedStyles } from "../styles/useThemedStyles";
import { useResponsive } from "../styles/theme";
import { LEARNER_ROLES, NMC_PAPERS } from "../data/nmcCurriculum";

const OnboardingScreen = ({ navigation, route }) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const { user, updateLearningProfile } = useContext(AppContext);
  const isEdit = route?.params?.edit === true;

  const [step, setStep] = useState(0);
  const [role, setRole] = useState(user?.learnerRole || "md_resident");
  const [paperFocus, setPaperFocus] = useState(
    user?.preferredPaperFocus || "all",
  );
  const [trainingYear, setTrainingYear] = useState(
    user?.trainingYear ?? null,
  );
  const [saving, setSaving] = useState(false);

  const finish = async (skipped = false) => {
    setSaving(true);
    try {
      await updateLearningProfile({
        onboardingCompleted: true,
        learnerRole: skipped ? user?.learnerRole || "other" : role,
        preferredPaperFocus: skipped
          ? user?.preferredPaperFocus || "all"
          : paperFocus,
        trainingYear: skipped
          ? user?.trainingYear ?? null
          : role === "md_resident"
            ? trainingYear
            : null,
      });
    } catch (err) {
      console.warn("Onboarding save failed:", err?.message);
    } finally {
      setSaving(false);
      if (isEdit) {
        navigation.goBack();
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      }
    }
  };

  const next = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      if (role === "md_resident") {
        setStep(2);
        return;
      }
      void finish(false);
      return;
    }
    void finish(false);
  };

  const Option = ({ selected, label, hint, onPress }) => (
    <TouchableOpacity
      style={[
        styles.option,
        selected && {
          borderColor: colors.secondary,
          backgroundColor: colors.primarySoft,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.optionTextCol}>
        <Text style={styles.optionLabel}>{label}</Text>
        {hint ? <Text style={styles.optionHint}>{hint}</Text> : null}
      </View>
      <MaterialIcons
        name={selected ? "radio-button-checked" : "radio-button-unchecked"}
        size={22}
        color={selected ? colors.secondary : colors.borderStrong}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
            width: "100%",
            alignSelf: "center",
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={styles.stepLabel}>
            {isEdit ? "Learning profile" : `Step ${step + 1} of ${role === "md_resident" || step < 1 ? 3 : 2}`}
          </Text>
          {!isEdit ? (
            <TouchableOpacity onPress={() => finish(true)} disabled={saving}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.skip}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {step === 0 ? (
          <>
            <Text style={styles.title}>Who are you?</Text>
            <Text style={styles.subtitle}>
              We use this to shape progress copy. You can change it anytime.
            </Text>
            {LEARNER_ROLES.map((r) => (
              <Option
                key={r.id}
                selected={role === r.id}
                label={r.label}
                hint={r.hint}
                onPress={() => setRole(r.id)}
              />
            ))}
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text style={styles.title}>Paper focus</Text>
            <Text style={styles.subtitle}>
              NMC splits theory into four papers. Pick a default Library filter.
            </Text>
            <Option
              selected={paperFocus === "all"}
              label="All papers"
              hint="Browse the full library"
              onPress={() => setPaperFocus("all")}
            />
            {NMC_PAPERS.map((p) => (
              <Option
                key={p.id}
                selected={String(paperFocus) === String(p.id)}
                label={`Paper ${p.roman} · ${p.shortTitle}`}
                hint={p.domains}
                onPress={() => setPaperFocus(String(p.id))}
              />
            ))}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.title}>Training year</Text>
            <Text style={styles.subtitle}>
              Optional. Suggests chapters for MD Year 1–3. Not an official NMC year syllabus.
            </Text>
            {[1, 2, 3].map((y) => (
              <Option
                key={y}
                selected={trainingYear === y}
                label={`Year ${y}`}
                hint={
                  y === 1
                    ? "Foundations, epi, biostats, thesis start"
                    : y === 2
                      ? "Programs, CD/NCD, field heavy"
                      : "Policy, revision, exams"
                }
                onPress={() => setTrainingYear(y)}
              />
            ))}
            <Option
              selected={trainingYear === null}
              label="Prefer not to say"
              hint="No year recommendations"
              onPress={() => setTrainingYear(null)}
            />
          </>
        ) : null}

        <Button
          mode="contained"
          buttonColor={colors.secondary}
          textColor={colors.onPrimary || "#fff"}
          style={styles.primaryBtn}
          loading={saving}
          disabled={saving}
          onPress={next}
        >
          {step === 2 || (step === 1 && role !== "md_resident")
            ? isEdit
              ? "Save"
              : "Start learning"
            : "Continue"}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.backgroundMain,
    },
    container: {
      paddingTop: 12,
      paddingBottom: 40,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    stepLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTertiary,
    },
    skip: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.secondary,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.textTitle,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textTertiary,
      lineHeight: 20,
      marginBottom: 16,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfacePrimary,
      marginBottom: 10,
    },
    optionTextCol: { flex: 1, paddingRight: 10 },
    optionLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textTitle,
    },
    optionHint: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 3,
      lineHeight: 16,
    },
    primaryBtn: {
      marginTop: 12,
      borderRadius: 12,
      paddingVertical: 4,
    },
  });

export default OnboardingScreen;
