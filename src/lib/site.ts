import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export type SiteSettings = {
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  bannerUrl: string | null;
  heroTitle: string | null;
  pusherKey: string | null;
  pusherCluster: string | null;
  pusherAppId: string | null;
  pusherSecret: string | null;
  deliveryFeeIn: number;
  deliveryFeeOut: number;
  reviewsAutoShow: boolean;
};

const FALLBACK: SiteSettings = {
  siteName: "SurjoSangstha",
  logoUrl: null, faviconUrl: null, bannerUrl: null, heroTitle: null,
  pusherKey: null, pusherCluster: null, pusherAppId: null, pusherSecret: null,
  deliveryFeeIn: 0, deliveryFeeOut: 60, reviewsAutoShow: false,
};

let cache: { at: number; value: SiteSettings } | null = null;

/** Admin-editable site settings (logo, banner, pusher, fees). 15s cache. */
export async function siteSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cache.at < 15_000) return cache.value;
  try {
    const [row] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    const value: SiteSettings = row
      ? {
          siteName: row.siteName, logoUrl: row.logoUrl, faviconUrl: row.faviconUrl, bannerUrl: row.bannerUrl, heroTitle: row.heroTitle,
          pusherKey: row.pusherKey, pusherCluster: row.pusherCluster, pusherAppId: row.pusherAppId, pusherSecret: row.pusherSecret,
          deliveryFeeIn: row.deliveryFeeIn, deliveryFeeOut: row.deliveryFeeOut, reviewsAutoShow: row.reviewsAutoShow,
        }
      : FALLBACK;
    cache = { at: Date.now(), value };
    return value;
  } catch {
    return FALLBACK;
  }
}

export function logoOf(s: SiteSettings) {
  return s.logoUrl?.trim() || "/logo.png";
}
export function faviconOf(s: SiteSettings) {
  return s.faviconUrl?.trim() || s.logoUrl?.trim() || "/logo.png";
}
