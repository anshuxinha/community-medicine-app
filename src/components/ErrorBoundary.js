import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button } from "react-native-paper";
import { lightColors as colors } from "../styles/theme";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              An unexpected error occurred. You can try reloading the app.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={this.handleReset}
                style={styles.button}
              >
                Try Again
              </Button>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  content: {
    flex: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textTitle,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  errorBox: {
    width: "100%",
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.error,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: "monospace",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    minWidth: 140,
  },
});

export default ErrorBoundary;
