import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Colors } from "@/constants/theme";
import { ErrorState } from "@/components/ErrorState";
import { logger } from "@/utils/logger";

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    flex: 1,
  },
});

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("error-boundary", error, { componentStack: info.componentStack });
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (!error) {
      return children;
    }

    if (fallback) {
      return fallback(error, this.reset);
    }

    return (
      <View style={styles.container}>
        <ErrorState
          description={__DEV__ ? error.message : "An unexpected error occurred. Please try again."}
          onRetry={this.reset}
          retryLabel="Reload"
          title="The app ran into a problem"
        />
      </View>
    );
  }
}
