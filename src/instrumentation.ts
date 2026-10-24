export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { ensureDatabase } = await import("@/lib/db-guard");
      await ensureDatabase();
      // প্রোডাকশনে প্রতিটি cold start-এ সিড চালানো ব্যয়বহুল — শুধু চাইলে চালান (AUTO_SEED=true)
      if (process.env.NODE_ENV === "production" && process.env.AUTO_SEED !== "true") {
        console.log("[SurjoSangstha] production: auto-seed skipped (set AUTO_SEED=true to enable once)");
        return;
      }
      const { seedIfNeeded } = await import("@/db/seed");
      const result = await seedIfNeeded();
      console.log(`[SurjoSangstha] database bootstrap: ${result}`);
    } catch (e) {
      console.warn("[SurjoSangstha] database bootstrap skipped:", (e as Error).message);
    }
  }
}
