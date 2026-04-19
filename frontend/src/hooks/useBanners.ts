import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useDatabase } from "../db";

export interface BannerDoc {
  id: string;
  name: string;
  templateId: string;
  themeId: string;
  platformId: string;
  fieldValues: Record<string, string>;
  borderWidth: number;
  borderColor: string;
  fontPairId: string;
  primaryFontFamily: string;
  secondaryFontFamily: string;
  fontSize: number;
  brandLogoUrl: string | null;
  brandLogoSize: number;
  tutorialImageUrl: string | null;
  tutorialImageSize: number;
  tutorialImageBottomPadding: number;
  tutorialImageOpacity: number;
  updatedAt: number;
}

export function useBanners() {
  const { db } = useDatabase();
  const [banners, setBanners] = useState<BannerDoc[]>([]);

  useEffect(() => {
    if (!db) return;
    const sub = db.banners
      .find({ sort: [{ updatedAt: "desc" }] })
      .$.subscribe((docs: any[]) => {
        setBanners(docs.map((d: any) => d.toJSON() as BannerDoc));
      });
    return () => sub.unsubscribe();
  }, [db]);

  const saveBanner = useCallback(
    async (data: Omit<BannerDoc, "id" | "updatedAt"> & { id?: string }) => {
      if (!db) return;
      const doc = { ...data, id: data.id ?? uuidv4(), updatedAt: Date.now() };
      await db.banners.upsert(doc);
      return doc.id;
    },
    [db],
  );

  const deleteBanner = useCallback(
    async (id: string) => {
      if (!db) return;
      const doc = await db.banners.findOne(id).exec();
      if (doc) await doc.remove();
    },
    [db],
  );

  const getBanner = useCallback(
    async (id: string) => {
      if (!db) return null;
      const doc = await db.banners.findOne(id).exec();
      return doc ? (doc.toJSON() as BannerDoc) : null;
    },
    [db],
  );

  return { banners, saveBanner, deleteBanner, getBanner };
}
