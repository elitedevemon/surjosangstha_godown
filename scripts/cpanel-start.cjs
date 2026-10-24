#!/usr/bin/env node
/**
 * SurjoSangstha — cPanel / low-memory safe production start.
 *
 * Use as the Application startup file in cPanel → Setup Node.js App
 * INSTEAD of server.js, if `next start` also crashes with
 * "WebAssembly.instantiate(): Out of memory".
 *
 * It launches the Next.js standalone server with --disable-wasm-trap-handler,
 * so the 10GB WASM virtual-memory cage is never requested under the 4GB LVE cap.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const candidates = [
  path.join(ROOT, "server.js"), // standalone output copied to app root
  path.join(ROOT, ".next", "standalone", "server.js"),
];

const target = candidates.find((p) => fs.existsSync(p));
if (!target) {
  console.error(
    "[cpanel-start] ❌ No standalone server.js found.\n" +
      "  Build first with:  node scripts/cpanel-build.cjs  (or BUILD_STANDALONE=true npm run build)\n" +
      "  then copy .next/standalone/server.js next to package.json if needed."
  );
  process.exit(1);
}

console.log(`[cpanel-start] Node ${process.versions.node} → starting ${path.relative(ROOT, target)}`);
console.log("[cpanel-start] Flags: --disable-wasm-trap-handler --max-old-space-size=2048");

const child = spawn(
  process.execPath,
  ["--disable-wasm-trap-handler", "--max-old-space-size=2048", target],
  { cwd: path.dirname(target), stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } }
);

child.on("exit", (code) => process.exit(code ?? 1));
