import { useState, useEffect } from "react";
import { initDatabase, type BannersDatabase } from "./database";

export function useDatabase(): {
  db: BannersDatabase | null;
  loading: boolean;
  error: Error | null;
} {
  const [db, setDb] = useState<BannersDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    initDatabase()
      .then((instance) => {
        if (!cancelled) {
          setDb(instance);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { db, loading, error };
}
