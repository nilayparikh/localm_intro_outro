import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../db";

export function usePresets() {
  const { db } = useDatabase();
  const [presets, setPresets] = useState<Record<string, any>>({});
  const [presetNames, setPresetNames] = useState<string[]>([]);

  useEffect(() => {
    if (!db) return;
    const sub = db.presets.find().$.subscribe((docs: any[]) => {
      const map: Record<string, any> = {};
      const names: string[] = [];
      for (const doc of docs) {
        map[doc.id] = doc.toJSON();
        names.push(doc.name);
      }
      setPresets(map);
      setPresetNames(names);
    });
    return () => sub.unsubscribe();
  }, [db]);

  const savePreset = useCallback(
    async (id: string, name: string, data: Record<string, any>) => {
      if (!db) return;
      await db.presets.upsert({ id, name, ...data, updatedAt: Date.now() });
    },
    [db],
  );

  const deletePreset = useCallback(
    async (id: string) => {
      if (!db) return;
      const doc = await db.presets.findOne(id).exec();
      if (doc) await doc.remove();
    },
    [db],
  );

  return { presets, presetNames, savePreset, deletePreset };
}
