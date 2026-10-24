# SurjoSangstha — কিস্তি ভিত্তিক ই-কমার্স প্ল্যাটফর্ম

Next.js 16 (App Router) + **MySQL** (Drizzle ORM) + Tailwind CSS v4।

## Features
- 3 ধরনের কিস্তি (দৈনিক / সাপ্তাহিক / মাসিক), 3 ধরনের পেমেন্ট (নগদ, COD, কিস্তি)
- Admin / Employee / Customer তিন ধরনের ড্যাশবোর্ড
- অফলাইন-ফার্স্ট কর্মী প্যানেল (localStorage কিউ + অটো সিঙ্ক)
- রিয়েল-টাইম নোটিফিকেশন (পোলিং + অপশনাল Pusher), সাউন্ড, ব্রাউজার নোটিফিকেশন
- 12+ চার্ট, লাইট/ডার্ক মোড, 100% রেসপন্সিভ
- মাল্টি-ব্রাঞ্চ: প্রতিটি শাখার আলাদা পণ্য, স্টক, গোডাউন, কর্মী, সার্ভিস এলাকা

## Demo logins (`DEMO_DATA=true`)
| Role | Phone | Password |
|---|---|---|
| Admin | 01700000000 | admin123 |
| Employee | 01711000001 | employee123 |
| Customer | 01811000001 | customer123 |

## Setup (MySQL)
```bash
npm install
# ডাটাবেস কানেকশন সেট করুন → src/db/config.ts (host, port, user, password, database)
sudo mysql -e "CREATE DATABASE IF NOT EXISTS ss_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'ss'@'127.0.0.1' IDENTIFIED BY 'ss123'; GRANT ALL PRIVILEGES ON ss_db.* TO 'ss'@'127.0.0.1'; FLUSH PRIVILEGES;"
npx drizzle-kit push --force
npx tsx src/db/seed-cli.ts
npm run dev
```

## Production
`.env`-এ `DEMO_DATA=false`, strong `AUTH_SECRET`, `ADMIN_PHONE`, `ADMIN_PASSWORD` দিন। সার্ভার স্টার্টে ডেমো ডাটা স্বয়ংক্রিয়ভাবে মুছে যাবে। বিস্তারিত: [instructions.md](./instructions.md)
