import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import NetInfo from "@react-native-community/netinfo";
import type { NetInfoState } from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

type NetworkContextValue = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

function deriveState(state: NetInfoState | null): NetworkContextValue {
  if (!state) {
    return { isConnected: true, isInternetReachable: null, type: "unknown" };
  }

  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
  };
}

export function NetworkProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    let cancelled = false;

    NetInfo.fetch().then((initial) => {
      if (!cancelled) {
        setState(initial);
      }
    });

    const unsubscribe = NetInfo.addEventListener((next) => {
      setState(next);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => deriveState(state), [state]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error("useNetwork must be used within NetworkProvider");
  }

  return context;
}

export function useIsOffline(): boolean {
  const { isConnected, isInternetReachable } = useNetwork();

  if (!isConnected) {
    return true;
  }

  return isInternetReachable === false;
}
