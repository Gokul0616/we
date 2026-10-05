import { useState, useEffect, useCallback } from "react";
import { syncClient } from "../services/reactiveSyncClient";

/**
 * Reactive query hook for real-time live data.
 * Automatically subscribes to queryName and re-renders whenever the backend database changes.
 */
export function useQuery<T = any>(queryName: string, args: Record<string, any> = {}): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);
  const argsString = JSON.stringify(args);

  useEffect(() => {
    const parsedArgs = JSON.parse(argsString);
    const unsubscribe = syncClient.subscribe(queryName, parsedArgs, (freshData: T) => {
      setData(freshData);
    });

    return () => {
      unsubscribe();
    };
  }, [queryName, argsString]);

  return data;
}

/**
 * Transactional mutation hook.
 * Returns a function to execute mutations that modify the backend and auto-push updates.
 */
export function useMutation<T = any>(mutationName: string) {
  return useCallback(
    (args: Record<string, any> = {}) => {
      return syncClient.mutation<T>(mutationName, args);
    },
    [mutationName]
  );
}
