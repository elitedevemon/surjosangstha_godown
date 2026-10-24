#!/usr/bin/env node
/**
 * SurjoSangstha — cPanel / low-memory safe production build.
 *
 * Run this INSTEAD of `npm run build` on shared hosting (CloudLinux/LVE):
 *     node scripts/cpanel-build.cjs
 *
 * What it does:
 *  1. Verifies Node >= 20.15 (required for --disable-wasm-trap-handler).
 *  2. Verifies the flag actually works on this Node binary.
 *  3. Runs `next build --webpack` (NOT Turbopack) with:
 *       --disable-wasm-trap-handler  → no 10GB virtual-memory cage,
 *                                      fits inside 4GB LVE "Max address space"
 *       --max-old-space-size=3072    → heap stays under the 4GB cap
 *  4. Disables telemetry (fewer WASM instantiations during build).
 *
 * The same flags live in package.json ("build" script), so plain
 * `npm run build` works too — this wrapper just makes it impossible
 * to run the build WITHOUT the fix.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

function log(msg) {
  console.log(`[cpanel-build] ${msg}`);
}
function fail(msg) {
  console.error(`\n[cpanel-build] ❌ ${msg}\n`);
  process.exit(1);
}

// ---- 1. Node version check ----
const major = Number(process.versions.node.split(".")[0]);
const minor = Number(process.versions.node.split(".")[1] ?? 0);
log(`Node ${process.versions.node} detected.`);
const flagSupported = major > 20 || (major === 20 && minor >= 15) || major >= 22;
if (major < 20 || !flagSupported) {
  fail(
    `Node ${process.versions.node} is too old. --disable-wasm-trap-handler needs Node >= 20.15.0.\n` +
      `  → cPanel → Setup Node.js App → Node.js version → pick 20.19.x or 22.x, then re-run.\n` +
      `  → If your host has no Node 20: build on your own PC (BUILD_STANDALONE=true npm run build)\n` +
      `    and upload .next/ instead. See instructions/cpanel.md.`
  );
}

// ---- 2. Verify the flag exists on this exact binary ----
const probe = spawnSync(process.execPath, ["--disable-wasm-trap-handler", "-e", ""], { stdio: "ignore" });
if (probe.status !== 0) {
  fail(
    "This Node binary does not accept --disable-wasm-trap-handler.\n" +
      "  → Switch to Node 20.15+ / 22.x in cPanel → Setup Node.js App."
  );
}
log("Flag --disable-wasm-trap-handler supported ✓");

// ---- 3. Show LVE / address-space limit when visible (Linux) ----
try {
  const fs = require("fs");
  const limits = fs.readFileSync("/proc/self/limits", "utf8");
  const line = limits.split("\n").find((l) => l.startsWith("Max address space"));
  if (line) log(`OS limit:${line.replace("Max address space", "").trim()} (trap-handler disabled, so this is fine)`);
} catch {
  /* not Linux — skip */
}

// ---- 4. Run the Webpack production build ----
log("Starting: next build --webpack (low-memory mode)…");
const res = spawnSync(
  process.execPath,
  [
    "--disable-wasm-trap-handler",
    "--max-old-space-size=3072",
    NEXT_BIN,
    "build",
    "--webpack",
  ],
  {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NODE_ENV: "production" },
  }
);

if (res.status !== 0) {
  fail(
    `next build exited with code ${res.status}.\n` +
      `  → If you see "WebAssembly.instantiate(): Out of memory", your host ignored\n` +
      `    the flags (some panels strip NODE_OPTIONS) — but this wrapper passes them\n` +
      `    directly to Node, so re-run THIS script (node scripts/cpanel-build.cjs)\n` +
      `    instead of "npm run build".\n` +
      `  → Still failing? Build on your PC and upload .next/ (see instructions/cpanel.md).`
  );
}

log("✅ Build finished successfully. Now Restart the app in cPanel (startup file: server.js).");
