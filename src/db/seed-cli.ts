import "dotenv/config";
import { seedIfNeeded, seedDemo } from "./seed";

const force = process.argv.includes("--force");
(force ? seedDemo().then(() => "reseeded") : seedIfNeeded())
  .then((r) => { console.log("[seed]", r); process.exit(0); })
  .catch((e) => { console.error("[seed] failed", e); process.exit(1); });
