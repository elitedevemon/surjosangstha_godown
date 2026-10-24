import net from "net";
import { execSync } from "child_process";
import { mysqlConfig } from "@/db/config";

function portOpen(host: string, port: number, timeout = 1200): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.connect({ host, port });
    let done = false;
    const finish = (v: boolean) => { if (done) return; done = true; try { s.destroy(); } catch { /* ignore */ } resolve(v); };
    s.on("connect", () => finish(true));
    s.on("error", () => finish(false));
    setTimeout(() => finish(false), timeout);
  });
}

/** Ensure the MySQL/MariaDB server (from src/db/config.ts) is running; start the system service if needed. */
export async function ensureDatabase() {
  const { host, port } = mysqlConfig;
  if (await portOpen(host, port)) return;
  // প্রোডাকশন/ম্যানেজড হোস্টে লোকাল সার্ভিস চালানোর চেষ্টা করা যাবে না
  const isLocal = host === "127.0.0.1" || host === "localhost";
  if (process.env.NODE_ENV === "production" || !isLocal) return;
  const starters = [
    "sudo -n service mariadb start 2>/dev/null",
    "sudo -n service mysql start 2>/dev/null",
    "service mariadb start 2>/dev/null",
    "service mysql start 2>/dev/null",
  ];
  for (const cmd of starters) {
    try { execSync(cmd, { stdio: "ignore", timeout: 20000 }); } catch { /* ignore */ }
    for (let i = 0; i < 15; i++) {
      if (await portOpen(host, port, 700)) return;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}
