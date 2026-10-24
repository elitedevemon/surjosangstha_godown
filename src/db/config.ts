/**
 * SurjoSangstha — MySQL কানেকশন কনফিগারেশন
 * ------------------------------------------------
 * লোকাল ডেভেলপমেন্টে নিচের মানগুলো ব্যবহার হয়।
 * প্রোডাকশনে (হোস্টিং) environment variable দিলে সেগুলো **অগ্রাধিকার** পায় —
 * তাই সোর্স কোডে পাসওয়ার্ড রাখার দরকার নেই।
 *
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL
 *   অথবা এক লাইনে: DATABASE_URL=mysql://user:pass@host:3306/dbname?ssl=true
 */

function fromUrl(url?: string) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // শুধু mysql:// গ্রহণ করা হয় — ভুল করে অন্য স্কিমা (postgres ইত্যাদি) দিলে উপেক্ষা করা হবে
    if (!/^mysql/i.test(u.protocol)) return null;
    return {
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ""),
      ssl: u.searchParams.get("ssl") === "true" || u.searchParams.get("sslmode") === "require",
    };
  } catch {
    return null;
  }
}

const fromEnvUrl = fromUrl(process.env.DATABASE_URL);

export const mysqlConfig = {
  /** MySQL সার্ভারের এড্রেস (local হলে 127.0.0.1) */
  host: process.env.DB_HOST ?? fromEnvUrl?.host ?? "127.0.0.1",
  /** MySQL পোর্ট */
  port: Number(process.env.DB_PORT ?? fromEnvUrl?.port ?? 3306),
  /** ইউজারনেম */
  user: process.env.DB_USER ?? fromEnvUrl?.user ?? "ss",
  /** পাসওয়ার্ড */
  password: process.env.DB_PASSWORD ?? fromEnvUrl?.password ?? "ss123",
  /** ডাটাবেসের নাম */
  database: process.env.DB_NAME ?? fromEnvUrl?.database ?? "ss_db",
  /** ক্লাউড MySQL (Aiven/TiDB/PlanetScale) সাধারণত TLS বাধ্যতামূলক করে */
  ssl: (process.env.DB_SSL ?? "").toLowerCase() === "true" || fromEnvUrl?.ssl === true,

  /* ---------------- কানেকশন অপশনস ---------------- */
  /** একসাথে কতটি কানেকশন (সার্ভারলেসে কম রাখা ভালো) */
  connectionLimit: Number(process.env.DB_POOL ?? (process.env.VERCEL ? 3 : 10)),
  /** ক্যারাক্টার সেট (বাংলা টেক্সটের জন্য utf8mb4 দরকার) */
  charset: "utf8mb4",
  /** DECIMAL ভ্যালু number হিসেবে আনবে */
  decimalNumbers: true,
  /** কানেকশন খোলতে সর্বোচ্চ সময় (ms) */
  connectTimeout: 15_000,
  /** idle কানেকশন কতক্ষণ রাখবে (ms) */
  idleTimeout: 60_000,
  /** TCP keepalive */
  enableKeepAlive: true,
} as const;

/** কানেকশন URL (drizzle-kit / টুলসের জন্য) */
export function mysqlUrl(config: typeof mysqlConfig = mysqlConfig) {
  const auth = `${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}`;
  return `mysql://${auth}@${config.host}:${config.port}/${config.database}${config.ssl ? "?ssl={\"rejectUnauthorized\":true}" : ""}`;
}
