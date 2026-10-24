# ☁️ প্রোডাকশন ডিপ্লয় — ফ্রি হোস্টিং (ধাপে ধাপে)

এই গাইডে **সম্পূর্ণ ফ্রিতে, কোনো কার্ড বা কাস্টম ডোমেইন ছাড়া** লাইভ সাইট বানানো দেখানো হয়েছে।
প্রোগ্রামিং অভিজ্ঞতা লাগবে না — শুধু ধাপগুলো কপি করে করুন।

> 🔗 সাধারণ সেটআপের ভিত্তি (`.env` রেফারেন্স, সাধারণ সমস্যা): [`universal-setup.md`](./universal-setup.md)

---

## 🧭 মোট ছবিটা আগে বুঝে নিন

এই অ্যাপটা Next.js (Node.js) — তাই PHP হোস্টিং (যেমন **InfinityFree**) চলবে না।
আমরা ৩টা ফ্রি সার্ভিস ব্যবহার করব:

```
   আপনার কোড                অ্যাপ চলবে যেখানে           ডাটা থাকবে যেখানে
┌──────────────┐          ┌──────────────────┐      ┌────────────────┐
│   GitHub     │ ───────▶ │   Render (ফ্রি)   │ ───▶ │  Aiven MySQL   │
│  (কোড রাখে)  │  auto    │ onrender.com URL  │ TLS  │  (ফ্রি DB)     │
└──────────────┘  deploy  └──────────────────┘      └────────────────┘
                                  │
                          cron-job.org (ঘুম বন্ধ করে)
```

| সার্ভিস | কাজ | খরচ |
|---|---|---|
| **GitHub** | কোড সংরক্ষণ ও Render-এ পাঠানো | ০৳ |
| **Aiven** | MySQL ডাটাবেস (সবসময় চালু) | ০৳ |
| **Render** | Next.js অ্যাপ হোস্টিং + ফ্রি সাবডোমেইন + HTTPS | ০৳ |
| **cron-job.org** | ১৫ মিনিটে অ্যাপ ঘুমিয়ে যাওয়া বন্ধ করে | ০৳ |

**আপনার সাইটের ঠিকানা হবে:** `https://surjosangstha.onrender.com` — আলাদা কোনো ডোমেইন কেনার দরকার নেই।

> 🕒 আনুমানিক সময়: ৩০–৪৫ মিনিট। ধীরে ধীরে করুন।

---

# ধাপ ১ — GitHub অ্যাকাউন্ট ও রিপোজিটরি

### ১.১ অ্যাকাউন্ট
1. ব্রাউজারে যান: **https://github.com**
2. উপরে ডানে **Sign up**
3. ইমেইল, পাসওয়ার্ড, ইউজারনেম দিন → ইমেইল ভেরিফাই করুন

### ১.২ নতুন রিপোজিটরি
1. লগইনের পর বাঁ পাশে **New** বা **+** → **New repository**
2. **Repository name:** `surjosangstha`
3. **Private** সিলেক্ট করুন (শুধু আপনি দেখবেন)
4. নিচে **Create repository** চাপুন
5. নতুন পেজে **"uploading an existing file"** নীল লিংকে ক্লিক করুন

### ১.৩ ফাইল আপলোড
1. আপনার কম্পিউটারে প্রজেক্ট ফোল্ডার খুলুন
2. **ফাইল সিলেক্ট করার সময় ⚠️:**
   - ✅ আপলোড করবেন: `src`, `public`, `package.json`, `package-lock.json`,
     `next.config.ts`, `drizzle.config.ts`, `tsconfig.json`, `render.yaml`,
     `.env.example` ইত্যাদি সব সোর্স ফাইল
   - ❌ **এড়িয়ে যাবেন:** `node_modules` ফোল্ডার (বিশাল, Render নিজে ইনস্টল করে),
     `.next` ফোল্ডার, `.env` ফাইল (পাসওয়ার্ড থাকে!), `uploads/` ফোল্ডার
3. সব ফাইল টেনে GitHub পেজে ছাড়ুন
4. নিচে সবুজ **Commit changes** চাপুন
5. ফাইল লিস্ট দেখা গেলে ধাপ শেষ ✅

> 💡 `node_modules`/`.next` আলাদা করা কঠিন হলে: ফোল্ডার থেকে ওই দুটো মুছে (নিরাপদ — `npm install` দিয়ে আবার আসে), বাকি সব জিপ করে আপলোডের পর `git` দিয়েও করা যায়। শুরুতে সবচেয়ে সহজ — VS Code-এর Source Control ট্যাব ব্যবহার।

---

# ধাপ ২ — Aiven-এ ফ্রি MySQL ডাটাবেস

### ২.১ অ্যাকাউন্ট ও সার্ভিস
1. যান: **https://aiven.io/free-mysql-database**
2. **Get building / Sign up** → ইমেইল দিয়ে রেজিস্টার (কোনো কার্ড চাইবে না)
3. ইমেইল ভেরিফাই করে লগইন করুন
4. ড্যাশবোর্ডে **Create service** চাপুন
5. সার্ভিস টাইপ: **MySQL**
6. প্ল্যান: **Free** (১GB) সিলেক্ট
7. **Cloud provider & region:** Singapore বা Mumbai (বাংলাদেশের কাছে দ্রুত)
8. সার্ভিসের নাম: `surjosangstha-db` (ডিফল্ট রাখলেও হবে)
9. **Create service** চাপুন

### ২.২ তৈরির অপেক্ষা
- সার্ভিস **REBUILDING** দেখাবে → **RUNNING** হতে ২–৩ মিনিট লাগে
- পেজ রিফ্রেশ দিতে থাকুন

### ২.৩ কানেকশন তথ্য কপি করুন (খুব গুরুত্বপূর্ণ!)
**RUNNING** হলে **Connection information** বক্স থেকে নোটপ্যাডে লিখে রাখুন:

| লেবেল | উদাহরণ মান |
|---|---|
| **Host** | `mysql-abc123.aivencloud.com` |
| **Port** | `12345` ⚠️ **৩৩০৬ নাও হতে পারে — যা দেখায় সেটাই নিন** |
| **User** | `avnadmin` |
| **Password** | 👁️ আইকন চেপে দেখে কপি করুন |
| **Database** | `defaultdb` |
| **SSL Mode / CA cert** | Required (পরে `DB_SSL=true` দেব) |

> 🔐 পাসওয়ার্ড শুধু এখানে দেখা যায় — হারালে Aiven থেকে রিসেট করতে হয়।

### ২.৪ (ঐচ্ছিক) লোকাল থেকে টেবিল পুশ
লাইভ ডিপ্লয়ের সময় `AUTO_SEED=true` দিলে Render নিজেই টেবিল বানাবে, তাই এই ধাপ এড়িয়ে ধাপ ৩-তে যেতে পারেন।

---

# ধাপ ৩ — Render-এ অ্যাপ ডিপ্লয়

### ৩.১ অ্যাকাউন্ট
1. যান: **https://render.com**
2. **Get Started for Free**
3. **Sign in with GitHub** বেছে নিন → GitHub অথরাইজ করুন

### ৩.২ ওয়েব সার্ভিস তৈরি
1. ড্যাশবোর্ডে উপরে **New +** বাটন → **Web Service**
2. GitHub রিপোর তালিকায় `surjosangstha` দেখবেন → পাশে **Connect**
   - না দেখলে **Configure account/App** → Repository access-এ রিপো দিন
3. ফর্ম এভাবে পূরণ করুন:

| ফিল্ড | কী দেবেন |
|---|---|
| **Name** | `surjosangstha` ← *এটাই আপনার সাবডোমেইন হবে; নাম নেওয়া থাকলে `surjosangstha-bd`-এর মতো দিন* |
| **Region** | **Singapore** |
| **Branch** | `main` (GitHub যা দেখায়) |
| **Runtime** | `Node` |
| **Root Directory** | খালি রাখুন |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

### ৩.৩ Environment Variables (সবচেয়ে গুরুত্বপূর্ণ অংশ)
**Advanced** বা **Add Environment Variable** বাটন চাপুন, তারপর একটি একটি করে যোগ করুন:

| Key | Value (ধাপ ২.৩-এর তথ্য বসান) |
|---|---|
| `NODE_VERSION` | `20` |
| `DB_HOST` | `mysql-abc123.aivencloud.com` |
| `DB_PORT` | `12345` *(Aiven যা দিয়েছে)* |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | *(Aiven password)* |
| `DB_NAME` | `defaultdb` |
| `DB_SSL` | `true` |
| `AUTH_SECRET` | *(নিচে দেখুন)* |
| `ADMIN_PHONE` | আপনার মোবাইল, যেমন `01700000000` |
| `ADMIN_PASSWORD` | শক্ত একটি পাসওয়ার্ড (admin123 **নয়**) |
| `DEMO_DATA` | `false` |
| `AUTO_SEED` | `true` |
| `COOKIE_SECURE` | `true` |

**AUTH_SECRET বানানো (CMD ছাড়াই):**
1. একটা নতুন ব্রাউজার ট্যাবে যেকোনো সাইট খুলে কীবোর্ডে **F12** চাপুন
2. **Console** ট্যাবে লিখুন:
   ```js
   crypto.randomUUID() + crypto.randomUUID()
   ```
3. Enter → লম্বা একটা টেক্সট আসবে, সেটা কপি করে `AUTH_SECRET`-এর Value-তে বসান

### ৩.৪ ডিপ্লয়
- নিচে **Create Web Service** চাপুন
- লাইভ লগ দেখা যাবে — বিল্ড হতে **৫–১০ মিনিট** লাগতে পারে
- সফল হলে উপরে লিংক আসবে: **https://surjosangstha.onrender.com**
- লগে `✓ Compiled successfully` ও `▲ Next.js ... Ready` দেখলে ঠিক আছে

> ❌ বিল্ড ফেইল হলে লগের লাল লেখা পড়ুন — সাধারণত env ভেরিয়েবল বাদ থাকা বা `node_modules` আপলোড করা। কোড ঠিক করে GitHub-এ commit করলে Render **নিজে নিজে আবার ডিপ্লয়** করবে।

---

# ধাপ ৪ — প্রথম চালু ও এডমিন অ্যাকাউন্ট

### ৪.১ হেলথ চেক
ব্রাউজারে খুলুন:
```
https://surjosangstha.onrender.com/api/health
```
- `{"ok":true}` দেখলে ডাটাবেস কানেকশন ঠিক ✅
- প্রথমবার ফ্রি টিয়ার জেগে উঠতে ৩০–৬০ সেকেন্ড লাগতে পারে — ধৈর্য ধরুন

### ৪.২ লগইন
1. `https://surjosangstha.onrender.com/login`
2. ফোন: `ADMIN_PHONE`-এ যা দিয়েছেন, পাসওয়ার্ড: `ADMIN_PASSWORD`-এ যা দিয়েছেন
3. এডমিন ড্যাশবোর্ড খুলবে

### ৪.৩ AUTO_SEED বন্ধ করুন (জরুরি)
1. Render ড্যাশবোর্ড → আপনার সার্ভিস → **Environment**
2. `AUTO_SEED` খুঁজে **Edit** → মান `false` করুন → **Save Changes**
3. Render অটো রিডিপ্লয় করবে

> এতে এডমিন অ্যাকাউন্ট ও টেবিল থাকবে, কিন্তু প্রতি কোল্ড স্টার্টে সিড চেষ্টা করবে না।

---

# ধাপ ৫ — অ্যাপ ঘুমানো বন্ধ করুন (Render ফ্রি)

**সমস্যা:** ফ্রি টিয়ারে ১৫ মিনিট কেউ ভিজিট না করলে অ্যাপ ঘুমিয়ে যায়;
পরের ভিজিটরকে ৩০–৬০ সেকেন্ড অপেক্ষা করতে হয়।
**সমাধান:** প্রতি ১০ মিনিটে একটি হালকা পিং পাঠানো — অ্যাপ জেগে থাকবে।

### cron-job.org সেটআপ (ফ্রি, ১ মিনিটের কাজ)
1. যান **https://cron-job.org** → **Sign up** (ফ্রি)
2. ইমেইল ভেরিফাই করে লগইন → **CREATE CRONJOB**
3. ফর্ম:
   - **Title:** `SurjoSangstha keep-alive`
   - **URL:**
     ```
     https://surjosangstha.onrender.com/api/ping
     ```
   - **Schedule:**
     - এক্সিকিউশন প্ল্যান: প্রতি **১০ মিনিট** (Advanced → Every 10 minutes,
       অথবা প্রিসেট "Every 10 minutes")
   - **Request method:** GET
4. **SAVE / CREATE** চাপুন
5. Dashboard-এ ক্রনটি **Enabled** (সবুজ) আছে কিনা দেখুন

> `/api/ping` ইচ্ছাকৃতভাবে অতি-হালকা — ডাটাবেসে হিট করে না, তাই Aiven/Render কোটা প্রায় খরচ হয় না (রেসপন্স ~৯ms)।

**বিকল্প:** [uptimerobot.com](https://uptimerobot.com) — একই কাজ, interval 5–10 min দিন।

---

# ধাপ ৬ — প্রোডাকশন ভেরিফিকেশন চেকলিস্ট

- [ ] `https://<আপনার-নাম>.onrender.com/api/health` → `{"ok":true}`
- [ ] হোমে পণ্য, ক্যাটাগরি, কার্ট দেখা যাচ্ছে
- [ ] এডমিন/কর্মী/কাস্টমার তিন রোলে লগইন হয়
- [ ] কর্মী প্যানেলে বিক্রয় এন্ট্রি দিলে এডমিন বেলে নোটিফিকেশন আসে
- [ ] হেল্পডেস্ক চ্যাট কাজ করে
- [ ] `DEMO_DATA=false` → সাইটে ডেমো অর্ডার দেখাচ্ছে না
- [ ] `AUTO_SEED=false` করা হয়েছে
- [ ] কিপ-অ্যালাইভ ক্রন চালু, ২০–৩০ মিনিট পরও সাইট দ্রুত খোলে

---

# ধাপ ৭ — আপডেট কীভাবে দেবেন

কোডে কোনো পরিবর্তন করলে:
1. GitHub রিপোর নতুন ফাইল আপলোড/commit করুন
2. Render **স্বয়ংক্রিয়ভাবে নতুন বিল্ড শুরু করবে** (Dashboard → Events-এ দেখা যাবে)
3. ৩–৬ মিনিটে লাইভ আপডেট

পরিবেশ ভ্যারিয়েবল বদলাতে: Render → Environment → Edit → Save (অটো রিডিপ্লয়)।

---

# 🧩 ঐচ্ছিক ফিচার যোগ করা

- **রিয়েল-টাইম (Pusher) ও মোবাইল পুশ:** [`pusher-pushnotification.md`](./pusher-pushnotification.md)
- **AI হেল্পডেস্ক (OpenRouter):** [`universal-setup.md` ধাপ ৭](./universal-setup.md)
- **নিজের ডোমেইন:** Render → আপনার সার্ভিস → **Settings → Custom Domains → Add Custom Domain** →
  Render যে DNS রেকর্ড দেবে তা আপনার ডোমেইন রেজিস্ট্রারে যোগ করুন → Render অটো ফ্রি SSL দেবে।
  (InfinityFree-র ফ্রি সাবডোমেইন কাজ করবে না; নিজের কেনা .com/.xyz ডোমেইন লাগবে।)

---

# ❗ সমস্যা হলে (ফ্রি ডিপ্লয়)

| লক্ষণ | কারণ | সমাধান |
|---|---|---|
| health `{"ok":false}` | DB ভ্যারিয়েবল ভুল / SSL বন্ধ | `DB_PORT` আবার মিলান (৩৩০৬ নাও হতে পারে), `DB_SSL=true` দিন |
| বিল্ড: `Cannot find module` | `node_modules` আপলোড করেছেন | GitHub থেকে `node_modules`, `.next` মুছে নতুন commit |
| বিল্ড: env error | ভ্যারিয়েবল বাদ | Render Environment-এ ১৩টি Key-ই আছে কিনা দেখুন |
| প্রথম ভিজিটে ৫০ সেকেন্ড দেরি | Render ঘুমিয়েছে | ধাপ ৫-এর ক্রন চালু করুন |
| `Table doesn't exist` | AUTO_SEED কাজ করেনি | একবার `AUTO_SEED=true` Save → তৈরি হলে আবার `false` |
| ছবি আপলোড হয় না | ৪MB+ বা রিড-অনলি ডিস্ক | ছোট ছবি দিন — ছবি অটো **ডাটাবেসে** সেভ হয়, এটাই স্বাভাবিক |
| লগইনে ফিরে আসে | `AUTH_SECRET` নেই/বদলেছে | একই সিক্রেট রাখুন; `COOKIE_SECURE=true` (HTTPS ঠিক আছে) |
| Aiven সংযোগ টাইমআউট | IP অ্যালাউলিস্ট/SSL | Aiven → Service → Advanced → IP allowlist-এ `0.0.0.0/0` (শুরুতে), SSL required |
| সাবডোমেইন নাম নেওয়া | `surjosangstha` ব্যস্ত | Render Name-এ `surjosangstha-bd`/`ss-customer` দিন; ক্রন URL-ও সেই নামে বদলান |
| ডেমো পণ্য দেখাচ্ছে | `DEMO_DATA=true` ছিল | `false` করে Save |
| ফ্রি কোটা শেষ | বেশি ট্রাফিক | বিল্ড/ট্রাফিক রিপোর্ট দেখুন; পরে পেইডে যান → [`cpanel.md`](./cpanel.md) |

---

## 📊 ফ্রি টিয়ারের সীমা (জেনে রাখা ভালো)
- **Render Free:** মাসে ৭৫০ ঘণ্টা (১টা সার্ভিস ২৪/৭ চালানোর জন্য যথেষ্ট), ৫১২MB RAM,
  ১৫ মিনিটে ঘুমায় (ক্রনে সমাধান), ১০০GB ব্যান্ডউইথ
- **Aiven Free:** ১GB RAM, ১GB স্টোরেজ — ডেমো/কম ট্রাফিকের জন্য যথেষ্ট; ট্রাফিক বাড়লে এক ক্লিকে আপগ্রেড, ডাটা থাকবে অক্ষত
- টেস্টিং (২–৩ মাস) শেষে পেইডে নেওয়ার গাইড: **[`cpanel.md`](./cpanel.md)**

➡️ **পরের ধাপ (রিয়েল-টাইম নোটিফিকেশন চাইলে):** [`pusher-pushnotification.md`](./pusher-pushnotification.md)
