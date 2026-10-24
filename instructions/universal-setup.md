# 🔧 ইউনিভার্সাল সেটআপ — লোকাল ও প্রোডাকশন উভয়ের জন্য

এই গাইডে সেই সেটআপগুলো আছে যা **লোকাল (আপনার কম্পিউটার) এবং প্রোডাকশন (লাইভ সার্ভার) — দুই জায়গাতেই** করতে হয়।

---

## 📋 সূচি
1. প্রয়োজনীয় অ্যাকাউন্ট ও টুলস
2. প্রজেক্ট ফাইল পাওয়া
3. ডিপেন্ডেন্সি ইনস্টল
4. `.env` ফাইল বানানো (Environment Variables)
5. ডাটাবেস তৈরি ও টেবিল সেটআপ
6. প্রথম লগইন
7. Pusher, Push, OpenRouter — কোনটা কী ও কখন লাগে
8. সাধারণ সমস্যা

---

## ১. প্রয়োজনীয় অ্যাকাউন্ট ও টুলস

### 🔨 টুলস (শুধু লোকাল ডেভেলপমেন্টে লাগে)

| টুল | কেন লাগে | ডাউনলোড |
|---|---|---|
| **Node.js** (v20 বা তার উপরে) | অ্যাপ চালাতে | [nodejs.org](https://nodejs.org) → LTS বাটন |
| **Git** (ঐচ্ছিক) | কোড হোস্টিংয়ে পাঠাতে | [git-scm.com](https://git-scm.com) |
| **MySQL বা MariaDB** | লোকাল ডাটাবেস | সবচেয়ে সহজ: [XAMPP](https://apachefriends.org) |

**লোকাল ডেভেলপমেন্টে Node যাচাই করুন** (Terminal/Command Prompt খুলে):
```bash
node -v     # v20.x.x দেখাবে
npm -v      # 10.x.x দেখাবে
```
> 💡 লাইভ হোস্টিংয়ে (Render/cPanel) এই টুলস আপনার লাগবে না — সার্ভার নিজেই ইনস্টল করে।

### 🌐 অ্যাকাউন্ট (প্রোডাকশনে লাগবে)

| সার্ভিস | কেন লাগে | ওয়েবসাইট |
|---|---|---|
| **GitHub** | কোড হোস্টিং (ফ্রি) | [github.com](https://github.com) |
| **Aiven** | ফ্রি ক্লাউড MySQL | [aiven.io/free-mysql-database](https://aiven.io/free-mysql-database) |
| **Render** | অ্যাপ হোস্টিং (ফ্রি, বাণিজ্যিক-বান্ধব) | [render.com](https://render.com) |
| **Pusher** | রিয়েল-টাইম (ঐচ্ছিক) | [pusher.com](https://pusher.com) |
| **OpenRouter** | AI হেল্পডেস্ক (ঐচ্ছিক) | [openrouter.ai](https://openrouter.ai) |
| **cron-job.org** | Render-এর ঘুম বন্ধ করতে (ফ্রি) | [cron-job.org](https://cron-job.org) |

> কোনো ফ্রি সার্ভিসেই ক্রেডিট কার্ড লাগে না।

---

## ২. প্রজেক্ট ফাইল পাওয়া

### লোকালে (যদি আপনার কাছে ZIP থাকে)
1. ZIP ফাইলটি একটি ফোল্ডারে Extract করুন, যেমন `Documents/surjosangstha`
2. Terminal/CMD খুলে সেই ফোল্ডারে যান:
   ```bash
   cd Documents/surjosangstha
   ```

### GitHub থেকে (যদি রিপো থাকে)
```bash
git clone https://github.com/আপনার-ইউজারনেম/surjosangstha.git
cd surjosangstha
```

### GitHub-এ আপলোড করতে (ব্রাউজার থেকে, CMD ছাড়া)
1. github.com → **New repository** → নাম `surjosangstha` → **Private** → Create
2. **"uploading an existing file"** লিংকে ক্লিক
3. প্রজেক্ট ফোল্ডারের ফাইলগুলো ড্র্যাগ করে ছাড়ুন
   > ⚠️ **`node_modules` ও `.next` ফোল্ডার ড্র্যাগ করবেন না** — এগুলো অনেক বড় এবং সার্ভার নিজেই তৈরি করে।
4. নিচে **Commit changes** চাপুন

---

## ৩. ডিপেন্ডেন্সি ইনস্টল

প্রজেক্ট ফোল্ডারে একবারই চালাতে হয়:
```bash
npm install
```
এটি `package.json`-এ তালিকাভুক্ত সব লাইব্রেরি ডাউনলোড করবে (`node_modules` ফোল্ডার তৈরি হবে)।
- ⏱️ ২–৫ মিনিট লাগতে পারে।
- ⚠️ কিছু warning স্বাভাবিক, ঘাবড়াবেন না। শুধু শেষে `error` এলে রিপোর্ট করুন।

---

## ৪. `.env` ফাইল বানানো (Environment Variables)

`.env` ফাইলে সংবেদনশীল তথ্য থাকে (পাসওয়ার্ড, সিক্রেট)। এটা **কখনো GitHub-এ আপলোড করবেন না**।

### ৪.১ ফাইল বানান
- প্রজেক্ট রুটে `.env` নামে নতুন ফাইল তৈরি করুন (Windows-এ `.env.` টাইপ করলে এক্সটেনশন ছাড়া `.env` হবে)
- অথবা টেমপ্লেট হিসেবে `.env.example` কপি করে নাম দিন `.env`

### ৪.২ সম্পূর্ণ ভ্যারিয়েবল রেফারেন্স

```env
# ============ ডাটাবেস (বাধ্যতামূলক) ============
# পদ্ধতি ক — এক লাইনে (ক্লাউড DB যেমন Aiven):
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DBNAME?ssl=true

# পদ্ধতি খ — আলাদা আলাদা (লোকাল XAMPP-এর জন্য সহজ):
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=ss_db
# DB_SSL=false

# ============ সিকিউরিটি (বাধ্যতামূলক) ============
# লম্বা র‍্যান্ডম স্ট্রিং। ব্রাউজারে F12 → Console-এ লিখুন:
#   crypto.randomUUID() + crypto.randomUUID()
AUTH_SECRET=এখানে-লম্বা-র‍্যান্ডম-স্ট্রিং-বসান

# প্রথম এডমিন অ্যাকাউন্ট (টেবিল খালি থাকলে অটো তৈরি হবে)
ADMIN_PHONE=01700000000
ADMIN_PASSWORD=admin123

# ============ ডেমো ডাটা ============
# true  = ৩ শাখা, ৩৩ পণ্য, ডেমো অর্ডার সিড হবে (টেস্টিংয়ের জন্য)
# false = পরিষ্কার প্রোডাকশন, কোনো ডেমো ডাটা থাকবে না
DEMO_DATA=true

# প্রোডাকশনে টেবিল/এডমিন অটো-তৈরি করতে প্রথমবার true, তারপর false
AUTO_SEED=false

# HTTPS-এ কুকি সুরক্ষিত (লোকাল http-এ false, লাইভ https-এ true)
COOKIE_SECURE=false

# ============ Pusher — রিয়েল-টাইম (ঐচ্ছিক) ============
# বিস্তারিত: instructions/pusher-pushnotification.md
# PUSHER_APP_ID=
# PUSHER_KEY=
# PUSHER_SECRET=
# PUSHER_CLUSTER=ap2
# NEXT_PUBLIC_PUSHER_KEY=
# NEXT_PUBLIC_PUSHER_CLUSTER=ap2

# ============ Web Push — মোবাইল/PC নোটিফিকেশন (ঐচ্ছিক) ============
# কমান্ড: npx web-push generate-vapid-keys
# VAPID_PUBLIC_KEY=
# VAPID_PRIVATE_KEY=
# VAPID_SUBJECT=mailto:admin@yourdomain.com

# ============ OpenRouter AI — হেল্পডেস্ক (ঐচ্ছিক) ============
# OPENROUTER_API_KEY=sk-or-v1-xxxxx
# OPENROUTER_MODEL=openrouter/free
# SITE_URL=http://localhost:3000
```

### ৪.৩ গুরুত্বপূর্ণ নিয়ম
- মানে `=`-এর পরে কোনো স্পেস দেবেন না
- পাসওয়ার্ডে বিশেষ ক্যারেক্টার থাকলে `DATABASE_URL`-এ URL-এনকোড করুন (`@` → `%40`)
- `.env` বদলালে সার্ভার রিস্টার্ট দিন
- লোকালে `.env` রুটে থাকে; Render-এ ড্যাশবোর্ডের Environment ট্যাবে

---

## ৫. ডাটাবেস তৈরি ও টেবিল সেটআপ

### ৫.১ লোকাল — XAMPP দিয়ে
1. XAMPP Control Panel চালু করুন → **Apache** ও **MySQL**-এর পাশে **Start**
2. **Admin** চাপুন (phpMyAdmin খুলবে)
3. বাঁ পাশে **New** → নাম `ss_db` → Collation `utf8mb4_unicode_ci` → **Create**
4. টার্মিনালে ফিরে চালান:
   ```bash
   npx drizzle-kit push --force
   ```
   এটি ২০টি টেবিল তৈরি করবে। `[✓] Changes applied` দেখলে হয়ে গেছে।
5. (টেস্টিং ডাটা চাইলে):
   ```bash
   npx tsx src/db/seed-cli.ts --force
   ```

### ৫.২ ক্লাউড — Aiven দিয়ে
1. সার্ভিস **RUNNING** হলে Connection Information থেকে মানগুলো `.env`-এ বসান (`DB_SSL=true` দিতে ভুলবেন না)
2. টেবিল তৈরি:
   ```bash
   npx drizzle-kit push --force
   ```
   > লোকাল কম্পিউটার থেকে ক্লাউড DB-তে push করতে Aiven ড্যাশবোর্ডে **আপনার IP allowlist**-এ যোগ করুন (Service overview → Advanced configuration → IP filter), অথবা 0.0.0.0/0 (টেস্টিংয়ের জন্য)।
3. সিড প্রোডাকশনে না চালানোই ভালো — বরং `AUTO_SEED=true` দিয়ে প্রথম ডিপ্লয়ে এডমিন তৈরি করে নিন।

### টেবিলগুলো কী কী
`branches, users, categories, products, serviceAreas, orders, orderItems, godownSessions, godownMovements, notifications, reviews, packages, helpdeskThreads/Messages/Kb, pushSubscriptions, media, settings, productRequests, letters(যদি থাকে)` — মোট ২০টি।

---

## ৬. অ্যাপ চালু ও প্রথম লগইন

### ডেভেলপমেন্ট মোডে চালানো
```bash
npm run dev
```
ব্রাউজারে খুলুন: **http://localhost:3000**
- কোড বদলালে সাথে সাথে রিলোড হয় (hot reload)
- বন্ধ করতে টার্মিনালে `Ctrl + C`

### প্রোডাকশন মোডে পরীক্ষা
```bash
npm run build
npm start
```

### ডিফল্ট লগইন

| রোল | ফোন | পাসওয়ার্ড | পেজ |
|---|---|---|---|
| **এডমিন** | `01700000000` | `admin123` | `/admin` |
| **কর্মী** | `01711000001` | `employee123` | `/employee` |
| **কাস্টমার** | `01811000001` | `customer123` | `/account` |

> 🔴 **লাইভে যাওয়ার আগে এডমিন পাসওয়ার্ড অবশ্যই বদলে নিন।**

### ঠিক আছে কিনা যাচাই
- http://localhost:3000/api/health → `{"ok":true}`
- হোমপেজে ৩৩টি পণ্য দেখা যায় (DEMO_DATA=true থাকলে)
- তিন রোলেই লগইন হয়

---

## ৭. ঐচ্ছিক ফিচার — কোনটা কী, কখন লাগে

### Pusher (রিয়েল-টাইম ডাটা)
- **কাজ:** একজনের অ্যাকশন সাথে সাথে অন্য স্ক্রিনে দেখা (অর্ডার, নোটিফিকেশন, ড্যাশবোর্ড রিফ্রেশ)
- **না থাকলে:** সিস্টেম থামে না — ১৫–৪৫ সেকেন্ড পর পর অটো-পোলিং হয়
- **গাইড:** [`pusher-pushnotification.md`](./pusher-pushnotification.md)

### Web Push (VAPID — মোবাইল/PC পুশ)
- **কাজ:** অ্যাপ বন্ধ থাকলেও ফোন/কম্পিউটারে OS-লেভেল নোটিফিকেশন
- **না থাকলে:** অ্যাপ খোলা থাকলে বেল আইকনে নোটিফিকেশন আসে
- **শর্ত:** লাইভ HTTPS; iPhone-এ PWA (Add to Home Screen) লাগে
- **গাইড:** [`pusher-pushnotification.md`](./pusher-pushnotification.md)

### OpenRouter AI (হেল্পডেস্ক)
- **কাজ:** কাস্টমারের অজানা প্রশ্নে AI খসড়া উত্তর দেয়; এডমিন যাচাই করে
- **না থাকলে:** নলেজ বেসে মিললে অটো-উত্তর, নাহলে এডমিনের রিপ্লাইয়ের অপেক্ষা
- **ফ্রি:** `openrouter/free` মডেল
- এডমিন প্যানেল → সেটিংস → "🤖 AI সহকারী" কার্ডে কী বসালেই চলে

---

## ৮. সাধারণ সমস্যা (Universal)

| সমস্যা | সমাধান |
|---|---|
| `npm install` fail | Node v20+ আছে কিনা দেখুন (`node -v`); ইন্টারনেট ঠিক থাকলে আবার চালান |
| `ECONNREFUSED` / health `ok:false` | MySQL/XAMPP চালু নেই, বা DB তথ্য ভুল। `.env` ও পোর্ট মিলিয়ে দেখুন |
| `Table doesn't exist` | `npx drizzle-kit push --force` চালান |
| ক্লাউড DB টাইমআউট | `DB_SSL=true` দিন; Aiven-এ IP allowlist দিন |
| লগইন টেকে না | `AUTH_SECRET` সেট করুন; HTTP-তে `COOKIE_SECURE=false` |
| ছবি আপলোড হয় না | সর্বোচ্চ ৪MB। লাইভ সার্ভারে ডিস্ক রিড-অনলি হলে ছবি অটো ডাটাবেসে যায় |
| `.env` বদলে কাজ হয় না | সার্ভার রিস্টার্ট (`Ctrl+C`, আবার `npm run dev`) |
| বাংলা অক্ষর `???` দেখায় | DB Collation `utf8mb4_unicode_ci` হতে হবে |
| পোর্ট ৩০০০ ব্যস্ত | Linux: `npx kill-port 3000`; Windows: Task Manager থেকে Node বন্ধ করুন |

---

## ➡️ পরের গাইড
- **নিজের কম্পিউটারে চালাতে:** [`local.md`](./local.md)
- **ফ্রিতে লাইভ করতে:** [`production.md`](./production.md)
- **পেইড cPanel/VPS-এ:** [`cpanel.md`](./cpanel.md)
- **রিয়েল-টাইম ও পুশ:** [`pusher-pushnotification.md`](./pusher-pushnotification.md)
