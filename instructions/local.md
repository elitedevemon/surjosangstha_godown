# 💻 লোকাল ইনস্টলেশন — নিজের কম্পিউটারে চালানো

এই গাইডে একদম শুরু থেকে দেখানো হয়েছে কীভাবে আপনার নিজের কম্পিউটারে (Windows/Mac/Linux) প্রজেক্টটি চালাবেন।
প্রোগ্রামিং জানার দরকার নেই — শুধু ধাপগুলো অনুসরণ করুন।

> 🔗 সাধারণ সেটআপের বিস্তারিত (`.env`-এর সব ভ্যারিয়েবল, সাধারণ সমস্যা): [`universal-setup.md`](./universal-setup.md)

---

## 📋 সূচি
1. সফটওয়্যার ইনস্টল
2. প্রজেক্ট ফোল্ডার প্রস্তুত
3. ডিপেন্ডেন্সি ইনস্টল
4. ডাটাবেস চালু ও তৈরি
5. `.env` ফাইল সেটআপ
6. টেবিল ও ডেমো ডাটা
7. অ্যাপ চালু
8. প্রথম লগইন ও ঘুরে দেখা
9. প্রতিদিন কীভাবে চালাবেন
10. সমস্যা সমাধান

---

## ১. সফটওয়্যার ইনস্টল

### ১.১ Node.js (বাধ্যতামূলক)
1. ব্রাউজারে যান: **https://nodejs.org**
2. বড় সবুজ **LTS** বাটনে ক্লিক করে ডাউনলোড করুন
3. ডাউনলোড হওয়া `.msi` (Windows) / `.pkg` (Mac) ফাইলে ডাবল-ক্লিক → সব ধাপে **Next** → **Install**
4. **যাচাই করুন:**
   - Windows: স্টার্ট মেনু থেকে **Command Prompt** (বা PowerShell) খুলুন
   - Mac: **Terminal** খুলুন (Cmd+Space → "Terminal")
   - লিখুন:
     ```bash
     node -v
     ```
   - `v20.x.x` বা এর উপরে দেখালে ✅ ঠিক আছে

### ১.২ ডাটাবেস — XAMPP (সবচেয়ে সহজ)
1. যান: **https://apachefriends.org** → **XAMPP for Windows/Mac/Linux** ডাউনলোড
2. ইনস্টল করুন (ডিফল্ট অপশন রাখুন)
3. ইনস্টল হয়ে গেলে **XAMPP Control Panel** চালু করুন
4. তালিকায় **Apache** ও **MySQL**-এর পাশে **Start** চাপুন
   - সবুজ রং হয়ে গেলে চলছে ✅
   - Apache না চালালেও চলবে, কিন্তু **MySQL চালু থাকতে হবে**

> 💡 XAMPP-এর MySQL ডিফল্টে: host=`127.0.0.1`, port=`3306`, user=`root`, password=**ফাঁকা**, কোনো আলাদা ইউজার বানাতে হয় না।

### ১.৩ কোড এডিটর (ঐচ্ছিক কিন্তু সুপারিশকৃত)
**VS Code** ইনস্টল করুন: https://code.visualstudio.com — ফাইল এডিট করা সহজ হবে।

---

## ২. প্রজেক্ট ফোল্ডার প্রস্তুত

### ZIP থেকে পেলে
1. ZIP ফাইলটি রাইট-ক্লিক → **Extract All / Extract Here**
2. একটি সহজ পাথে রাখুন, যেমন `C:\surjosangstha` (Windows) বা `~/surjosangstha` (Mac/Linux)
   - পাথে বাংলা বা ফাঁকা থাকা ফোল্ডার এড়িয়ে চলুন

### Terminal-এ ফোল্ডারে যাওয়া
**Windows:**
```bash
cd C:\surjosangstha
```
**Mac/Linux:**
```bash
cd ~/surjosangstha
```

> 💡 **VS Code ব্যবহার করলে:** File → Open Folder → প্রজেক্ট ফোল্ডার সিলেক্ট → মেনু থেকে Terminal → New Terminal (স্বয়ংক্রিয়ভাবে সঠিক ফোল্ডারে খুলবে)।

ফাইলগুলো আছে কিনা যাচাই:
```bash
dir          # Windows
ls           # Mac/Linux
```
`package.json`, `src/` ফোল্ডার, `drizzle.config.ts` দেখলে সঠিক ফোল্ডারে।

---

## ৩. ডিপেন্ডেন্সি ইনস্টল

টার্মিনালে লিখুন:
```bash
npm install
```
- ⏱️ ২–৫ মিনিট লাগবে
- `node_modules` ফোল্ডার তৈরি হবে (এটাই সব লাইব্রেরি)
- হলুদ warning নিরাপদ — শুধু লাল `error` থাকলে সমস্যা

---

## ৪. ডাটাবেস চালু ও তৈরি

### ৪.১ MySQL চালু আছে নিশ্চিত করুন
XAMPP Control Panel-এ MySQL-এর পাশে সবুজ **Running** দেখতে হবে।

### ৪.২ `ss_db` ডাটাবেস তৈরি

**সহজ উপায় — phpMyAdmin:**
1. XAMPP-এ MySQL-এর পাশে **Admin** চাপুন (ব্রাউজারে phpMyAdmin খুলবে: http://localhost/phpmyadmin)
2. বাঁ পাশের সাইডবারে **New**-এ ক্লিক
3. **Create database** বক্সে লিখুন: `ss_db`
4. পাশের ড্রপডাউনে বেছে নিন: **`utf8mb4_unicode_ci`**
5. **Create** চাপুন → বাঁ পাশে `ss_db` দেখা যাবে ✅

**কমান্ড লাইন উপায় (বিকল্প):**
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS ss_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## ৫. `.env` ফাইল সেটআপ

1. প্রজেক্ট রুটে `.example.env` ফাইল খুঁজুন (বা নতুন ফাইল বানান)
2. কপি করে নাম দিন **`.env`**
   - Windows Explorer: নতুন টেক্সট ফাইলের নাম `.env.` দিলে `.env` হবে
   - VS Code: File → New File → `.env`
3. লোকাল ডেভেলপমেন্টের জন্য নিচের কনটেন্ট রাখুন:

```env
# XAMPP লোকাল ডাটাবেস (কানেকশন src/db/config.ts-এও ডিফল্ট)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ss_db
DB_SSL=false

# সিকিউরিটি — লোকালে যেকোনো লম্বা স্ট্রিং; লাইভে র‍্যান্ডম
AUTH_SECRET=local-development-secret-please-change-in-production

# ডিফল্ট এডমিন (টেবিল খালি থাকলে অটো তৈরি)
ADMIN_PHONE=01700000000
ADMIN_PASSWORD=admin123

# লোকাল টেস্টিং: ডেমো ডাটা চালু
DEMO_DATA=true
AUTO_SEED=false
COOKIE_SECURE=false
```

> সম্পূর্ণ ভ্যারিয়েবল রেফারেন্স: [`universal-setup.md` ধাপ ৪](./universal-setup.md)

**যদি XAMPP-তে MySQL root-এ পাসওয়ার্ড দিয়ে থাকেন:** `DB_PASSWORD=` এর পর সেটি বসান।

---

## ৬. টেবিল ও ডেমো ডাটা

### ৬.১ টেবিল তৈরি
টার্মিনালে:
```bash
npx drizzle-kit push --force
```
- শেষে `[✓] Changes applied` দেখাবে
- phpMyAdminে `ss_db` খুললে ২০টি টেবিল দেখা যাবে

### ৬.২ ডেমো ডাটা (টেস্টিংয়ের জন্য)
```bash
npx tsx src/db/seed-cli.ts --force
```
এটি তৈরি করবে:
- ৩টি শাখা, ১৪ জন ইউজার (এডমিন/কর্মী/কাস্টমার), ৩৩টি পণ্য, নমুনা অর্ডার/গোডাউন সেশন
- হেল্পডেস্ক নলেজ বেসের কয়েকটি প্রশ্নোত্তর

> ডেমো ডাটা মুছতে চাইলে: `npx tsx src/db/seed-cli.ts --remove`

---

## ৭. অ্যাপ চালু

### ডেভেলপমেন্ট মোড (প্রতিদিনের কাজে এটাই)
```bash
npm run dev
```
- দেখাবে: `▲ Next.js ... Ready in ...`
- ব্রাউজারে খুলুন: **http://localhost:3000**
- স্টোরফ্রন্ট দেখতে পাবেন — ছবি, ক্যাটাগরি, পণ্য
- **বন্ধ করতে:** টার্মিনালে `Ctrl + C`

### প্রোডাকশন মোডে পরীক্ষা (লাইভের মতো দেখতে)
```bash
npm run build
npm start
```
একই লিংকে খুলবে, তবে অপটিমাইজড ও দ্রুত।

---

## ৮. প্রথম লগইন ও ঘুরে দেখা

### ৩টি প্যানেল

**এডমিন প্যানেল:**
1. http://localhost:3000/login এ যান
2. ফোন: `01700000000`, পাসওয়ার্ড: `admin123`
3. উপরে ডানে নাম → **ড্যাশবোর্ড** ক্লিক করুন
4. যা পাবেন: অর্ডার, পণ্য, গোডাউন, কর্মী, কাস্টমার, শাখা, এরিয়া, রিপোর্ট, হেল্পডেস্ক, সেটিংস

**কর্মী প্যানেল:**
1. লগআউট করে আবার লগইন
2. ফোন: `01711000001`, পাসওয়ার্ড: `employee123`
3. ড্যাশবোর্ড, গোডাউন (নেওয়া/ফেরত/ক্লেইম), বিক্রয় এন্ট্রি, প্যাকেজ, পণ্যের চাহিদা

**কাস্টমার অ্যাকাউন্ট:**
- ফোন: `01811000001`, পাসওয়ার্ড: `customer123`
- http://localhost:3000/account

### যাচাই চেকলিস্ট
- [ ] হোমপেজে ৩৩টি পণ্য দেখা যায়
- [ ] তিন রোলেই লগইন হয়
- [ ] কর্মী হিসেবে বিক্রয় এন্ট্রি দিলে এডমিনে নোটিফিকেশন আসে (বেল 🔔)
- [ ] নিচে ডানে **সাহায্য** বাটন থেকে হেল্পডেস্ক চ্যাট খোলে
- [ ] http://localhost:3000/api/health → `{"ok":true}`

---

## ৯. প্রতিদিন কীভাবে চালাবেন

প্রতিদিন কোড চালাতে হলে:
1. **XAMPP Control Panel** → MySQL **Start**
2. টার্মিনালে প্রজেক্ট ফোল্ডারে গিয়ে:
   ```bash
   npm run dev
   ```
3. ব্রাউজারে http://localhost:3000
4. কাজ শেষে `Ctrl + C`, XAMPP বন্ধ

> কোড ফাইল নতুন না নামালে `npm install` বারবার চালানোর দরকার নেই — শুধু প্রথমবার।

---

## ১০. সমস্যা সমাধান (লোকাল)

| সমস্যা | সমাধান |
|---|---|
| `npm: command not found` | Node.js ইনস্টল হয়নি/রিস্টার্ট দিন; ধাপ ১ দেখুন |
| `ECONNREFUSED 127.0.0.1:3306` | XAMPP-তে MySQL Start হয়নি — Control Panel চেক করুন |
| `Table 'ss_db.products' doesn't exist` | `npx drizzle-kit push --force` চালান |
| বাংলা লেখা `????` | ডাটাবেস Collation `utf8mb4_unicode_ci` নয় — phpMyAdminে Operation ট্যাব থেকে বদলান |
| `Port 3000 already in use` | চালু থাকা Node বন্ধ করুন, অথবা: `npx kill-port 3000` |
| পোর্ট ৩৩০৬ ব্যস্ত | XAMPP-তে অন্য কোনো MySQL (WAMP/Workbench) চলছে — সেটি বন্ধ করুন |
| ছবি আপলোড হয় না | ৪MB-র নিচে দিন; `uploads/` ফোল্ডার লেখার অনুমতি আছে তো? |
| লগইনের পর আবার লগইন পেজ | `.env`-এ `AUTH_SECRET` আছে কিনা দেখুন; ব্রাউজার কুকিজ ক্লিয়ার করুন |
| `npm run dev` এ error | `node_modules` মুছে আবার: `rm -rf node_modules && npm install` |

---

## ➡️ এরপর
- লাইভে নিতে চাইলে (ফ্রি): **[`production.md`](./production.md)**
- পেইড হোস্টিং/cPanel: **[`cpanel.md`](./cpanel.md)**
- রিয়েল-টাইম ও মোবাইল পুশ: **[`pusher-pushnotification.md`](./pusher-pushnotification.md)**
