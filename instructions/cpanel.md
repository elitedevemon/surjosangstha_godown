# 💳 cPanel-এ SurjoSangstha লাইভ করার চূড়ান্ত গাইড (A to Z)

আপনার cPanel-এ **503 Service Unavailable** এবং **`Could not find a production build in the '.next' directory`** বা **`WebAssembly Out of memory`** আসার মূল কারণ:
1. সার্ভারে `.next` ফোল্ডারের প্রোডাকশন বিল্ড ফাইল তৈরি হয়নি অথবা বিল্ড চলাকালে মেমরি শেষ হয়ে ক্র্যাশ করেছে।
2. cPanel-এর CloudLinux LVE লিমিটে মেমরি কম থাকায় সার্ভারে সরাসরি বিল্ড নেওয়া অনেক সময় আটকে যায়।

এই গাইডে **২টি নিশ্চিত ও পরীক্ষিত পদ্ধতি** দেওয়া হলো:
- **পদ্ধতি ১ (সবচেয়ে সহজ ও ১০০% নিশ্চিত - কোনো এরর আসবে না):** নিজের PC-তে এক ক্লিকে বিল্ড করে সার্ভারে আপলোড। (কোনো কমান্ড ঝামেলা ছাড়া সাইট সাথে সাথে লাইভ)।
- **পদ্ধতি ২ (সার্ভারে সরাসরি বিল্ড):** cPanel-এর `Run JS script` বাটন ব্যবহার করে ক্লাউড মেমরি ক্র্যাশ এড়িয়ে বিল্ড করা।

---

## 📑 ধাপসমূহের তালিকা
1. [ধাপ ১: cPanel-এ MySQL ডাটাবেস ও ইউজার তৈরি](#ধাপ-১-cpanel-এ-mysql-ডাটাবেস-ও-ইউজার-তৈরি)
2. [ধাপ ২ (পদ্ধতি ১ - ১০০% নিশ্চিত): নিজের PC-তে প্রোডাকশন ফাইল তৈরি](#ধাপ-২-পদ্ধতি-১---নিজের-pc-তে-প্রোডাকশন-ফাইল-তৈরি-সুপারিশকৃত)
3. [ধাপ ৩: cPanel File Manager-এ ফাইল আপলোড](#ধাপ-৩-cpanel-file-manager-এ-ফাইল-আপলোড)
4. [ধাপ ৪: cPanel "Setup Node.js App" কনফিগারেশন](#ধাপ-৪-cpanel-setup-nodejs-app-কনফিগারেশন)
5. [ধাপ ৫: Environment Variables সেট করা](#ধাপ-৫-environment-variables-সেট-করা)
6. [ধাপ ৬: ডাটাবেস টেবিল তৈরি ও সিড (Data Seed) করা](#ধাপ-৬-ডাটাবেস-টেবিল-তৈরি-ও-সিড-করা)
7. [ধাপ ৭: সাইট চালু ও 503 এরর সমাধান](#ধাপ-৭-সাইট-চালু-ও-৫০৩-এরর-সমাধান)
8. [ধাপ ৮: ডেমো ডাটা বন্ধ করা (Production Mode)](#ধাপ-৮-ডেমো-ডাটা-বন্ধ-করা-production-mode)
9. [ধাপ ৯ (বিকল্প পদ্ধতি ২): সার্ভারে সরাসরি Run JS script দিয়ে বিল্ড](#ধাপ-৯-বিকল্প-পদ্ধতি-২-সার্ভারে-সরাসরি-run-js-script-দিয়ে-বিল্ড)

---

### ধাপ ১: cPanel-এ MySQL ডাটাবেস ও ইউজার তৈরি

১. আপনার cPanel-এ লগইন করুন।  
২. **Databases** সেকশন থেকে **MySQL® Databases**-এ ক্লিক করুন।  
৩. **Create New Database**:
   - `New Database:` ঘরে নাম দিন: `ss_db`
   - **Create Database** বাটনে ক্লিক করুন।  
   *(আপনার cPanel ইউজারনেমসহ ডাটাবেসের পুরো নাম হবে, যেমন: `cpaneluser_ss_db`। এটি নোটপ্যাডে লিখে রাখুন)*  
৪. নিচে স্ক্রোল করে **Add New User**-এ যান:
   - `Username:` দিন `ss_user` (পুরো নাম হবে যেমন: `cpaneluser_ss_user`)
   - `Password:` এবং `Password (Again):` ঘরে একটি শক্তিশালী পাসওয়ার্ড দিন (অথবা Password Generator ব্যবহার করুন)।
   - **Create User** বাটনে ক্লিক করুন। পাসওয়ার্ডটি নোটপ্যাডে সংরক্ষণ করুন।  
৫. আরও নিচে **Add User To Database** সেকশনে যান:
   - `User:` সিলেক্ট করুন আপনার তৈরি ইউজার (`cpaneluser_ss_user`)
   - `Database:` সিলেক্ট করুন আপনার তৈরি ডাটাবেস (`cpaneluser_ss_db`)
   - **Add** বাটনে ক্লিক করুন।
   - পরবর্তী স্ক্রিনে **ALL PRIVILEGES** চেকবক্সে টিক দিন এবং নিচে **Make Changes** বাটনে ক্লিক করুন।

---

### ধাপ ২ (পদ্ধতি ১ - নিজের PC-তে প্রোডাকশন ফাইল তৈরি - সুপারিশকৃত)

cPanel-এর ৪GB মেমরি সীমার কারণে সার্ভারে বিল্ড দিতে গেলে প্রায়ই `WebAssembly Out of memory` হয়। নিজের পিসিতে বিল্ড করে আপলোড করলে এই সমস্যা ০% হয়ে যায়।

১. আপনার পিসিতে প্রজেক্ট ফোল্ডারে টার্মিনাল/VS Code টার্মিনাল খুলুন।  
২. টার্মিনালে নিচের কমান্ডটি দিয়ে নির্ভরতা ইন্সটল করুন:
   ```bash
   npm install
   ```
৩. এবার Standalone বিল্ড তৈরি করুন:
   - **Windows PowerShell হলে:**
     ```powershell
     $env:BUILD_STANDALONE="true"; npm run build
     ```
   - **Windows Command Prompt (CMD) হলে:**
     ```cmd
     set BUILD_STANDALONE=true&& npm run build
     ```
   - **Mac বা Linux হলে:**
     ```bash
     BUILD_STANDALONE=true npm run build
     ```
৪. বিল্ড সফলভাবে সম্পন্ন হলে টার্মিনালে `✓ Compiled successfully` দেখতে পাবেন এবং আপনার প্রোজেক্টে `.next` ফোল্ডারের ভেতর `standalone` ফোল্ডার তৈরি হবে।  
৫. **খুবই জরুরি ধাপ (Static Assets কপি):**  
   Next.js-এর নিয়ম অনুযায়ী `.next/standalone`-এর ভেতর static ফাইলগুলো কপি করে দিতে হয়:
   - **Windows PowerShell:**
     ```powershell
     Copy-Item -Recurse -Force .next\static .next\standalone\.next\static
     Copy-Item -Recurse -Force public .next\standalone\public
     ```
   - **Mac/Linux:**
     ```bash
     mkdir -p .next/standalone/.next
     cp -r .next/static .next/standalone/.next/static
     cp -r public .next/standalone/public
     ```
৬. **আপলোডের জন্য জিপ (ZIP) তৈরি:**  
   আপনার প্রোজেক্ট ফোল্ডার থেকে নিচের ফাইল ও ফোল্ডারগুলো একসাথে সিলেক্ট করে একটি জিপ ফাইল বানান (নাম দিন `deploy.zip`):
   - `.next` (ফোল্ডার)
   - `public` (ফোল্ডার)
   - `scripts` (ফোল্ডার)
   - `src` (ফোল্ডার)
   - `package.json`
   - `next.config.ts`
   - `drizzle.config.ts`
   - `tsconfig.json`
   *(⚠️ সতর্কবার্তা: `node_modules` এবং `.env` জিপে নিবেন না)*

---

### ধাপ ৩: cPanel File Manager-এ ফাইল আপলোড

১. cPanel ড্যাশবোর্ড থেকে **File Manager** খুলুন।  
২. আপনার মূল হোম ডিরেক্টরিতে যান (`/home/username/`)।  
   *(⚠️ `public_html`-এর ভেতরে কোনো প্রজেক্ট ফাইল রাখবেন না, এটি বাইরে রাখা নিরাপদ)*  
৩. উপরে **+ Folder** বাটনে ক্লিক করে একটি নতুন ফোল্ডার তৈরি করুন, নাম দিন: `surjo-app`  
৪. `surjo-app` ফোল্ডারের ভেতরে ডাবল-ক্লিক করে ঢুকুন।  
৫. উপরে **Upload** বাটনে ক্লিক করে আপনার PC থেকে তৈরি করা `deploy.zip` ফাইলটি আপলোড করুন।  
৬. আপলোড ১০০% সবুজ হলে File Manager-এ ফিরে এসে `deploy.zip`-এর উপর রাইট ক্লিক করে **Extract** করুন।  
৭. ভেতরে একটি নতুন ফোল্ডার তৈরি করুন নাম দিন: `uploads` এবং এর পারমিশন `755` আছে কিনা দেখে নিন।

---

### ধাপ ৪: cPanel "Setup Node.js App" কনফিগারেশন

১. cPanel ড্যাশবোর্ডে গিয়ে সার্চ বক্সে লিখুন **Node** এবং **Setup Node.js App** (বা CloudLinux NodeJS Selector)-এ ক্লিক করুন।  
২. ডানপাশে **Create Application** বাটনে ক্লিক করুন।  
৩. ফর্মটি এভাবে পূরণ করুন:
   - **Node.js version:** `20.x` বা `22.x` (সবচেয়ে লেটেস্ট ড্রপডাউন থেকে বাছুন, নূন্যতম 20.15+)  
   - **Application mode:** `Production`  
   - **Application root:** `surjo-app` (ধাপ ৩-এ যে ফোল্ডারে ফাইল রেখেছেন)  
   - **Application URL:** আপনার ডোমেইন বা সাব-ডোমেইন সিলেক্ট করুন (যেমন: `yourdomain.com`)  
   - **Application startup file:** `scripts/cpanel-start.cjs`  
     *(আমরা প্রজেক্টের ভেতরে `scripts/cpanel-start.cjs` বানিয়ে রেখেছি, এটি স্বয়ংক্রিয়ভাবে মেমরি এরর এড়িয়ে standalone `server.js` ফাইলটিকে চালু করে)*  
৪. নিচে ডানপাশে **Create** বাটনে ক্লিক করুন।  
৫. পেজের উপরে দেখবেন লেখা আসবে Application is created successfully.

---

### ধাপ ৫: Environment Variables সেট করা

একই পেজে (Setup Node.js App) নিচে স্ক্রোল করলে **ENVIRONMENT VARIABLES** অপশন পাবেন।  
সেখানে **Add Variable** বাটনে ক্লিক করে নিচের ভেরিয়েবলগুলো এক এক করে যোগ করুন:

| Variable Name | Value | বিবরণ |
|---|---|---|
| `NODE_ENV` | `production` | প্রোডাকশন মোড চালু |
| `DB_HOST` | `localhost` | cPanel-এর লোকাল ডাটাবেস হোস্ট |
| `DB_PORT` | `3306` | MySQL ডিফল্ট পোর্ট |
| `DB_USER` | `cpaneluser_ss_user` | ধাপ ১-এ তৈরি করা পুরো ইউজারনেম |
| `DB_PASSWORD` | `আপনার_পাসওয়ার্ড` | ধাপ ১-এর ডাটাবেস পাসওয়ার্ড |
| `DB_NAME` | `cpaneluser_ss_db` | ধাপ ১-এর পুরো ডাটাবেসের নাম |
| `DB_SSL` | `false` | একই সার্ভারে লোকাল ডাটাবেস হওয়ায় SSL লাগবে না |
| `AUTH_SECRET` | `যেকোনো_লম্বা_রেন্ডম_স্ট্রিং` | লগইন সেশন সুরক্ষার সিক্রেট কি |
| `ADMIN_PHONE` | `01700000000` | আপনার এডমিন মোবাইল নম্বর |
| `ADMIN_PASSWORD` | `admin123` | আপনার এডমিন পাসওয়ার্ড (পরবর্তীতে পরিবর্তনযোগ্য) |
| `DEMO_DATA` | `true` | শুরুতে টেস্টিং ডাটা চাইলে `true`, ফ্রেশ চাইলে `false` |
| `AUTO_SEED` | `true` | **প্রথমবার চালুর জন্য অবশ্যই `true` রাখবেন** |
| `COOKIE_SECURE` | `true` | আপনার ডোমেইনে SSL (HTTPS) থাকলে `true` |
| `SITE_URL` | `https://yourdomain.com` | আপনার সম্পূর্ণ ওয়েবসাইটের লিংক |

সবগুলো বসিয়ে **Save** বাটনে ক্লিক করুন।

---

### ধাপ ৬: ডাটাবেস টেবিল তৈরি ও সিড করা

আপনার প্রজেক্টের `src/instrumentation.ts` এবং `src/db/seed.ts` এমনভাবে তৈরি যে প্রথমবার অ্যাপটি স্টার্ট হলেই এটি স্বয়ংক্রিয়ভাবে ডাটাবেস টেবিল তৈরি ও প্রয়োজনীয় তথ্য ইনসার্ট করে নেয় যদি `AUTO_SEED=true` থাকে।

তবুও নিশ্চিন্ত হওয়ার জন্য cPanel থেকে ডিপেন্ডেন্সি ইন্সটল করে টেবিল পুশ করার নিয়ম:
১. Setup Node.js App পেজে গিয়ে **Run NPM Install** বাটনে ক্লিক করুন। (এটি ২-৩ মিনিট সময় নিয়ে `node_modules` তৈরি করবে)।  
২. যদি cPanel-এ **Terminal** অপশন থাকে:
   - Terminal ওপেন করুন এবং কমান্ড দিন:
     ```bash
     cd ~/surjo-app
     npx drizzle-kit push --force
     npx tsx src/db/seed-cli.ts
     ```
   - এটি মুহূর্তের মধ্যে আপনার ডাটাবেসে ২০টি টেবিল তৈরি করে সুপার এডমিন ও ডেমো ডাটা সিড করে দেবে।
৩. যদি Terminal না থাকে:
   - কোনো চিন্তা নেই! ধাপ ৭ অনুযায়ী অ্যাপটি শুধু একবার রিস্টার্ট দিলেই প্রথম রিকোয়েস্টে ব্যাকগ্রাউন্ড কোড স্বয়ংক্রিয়ভাবে ডাটাবেস প্রস্তুত করে নেবে।

---

### ধাপ ৭: সাইট চালু ও ৫০৩ এরর সমাধান

১. Setup Node.js App পেজে গিয়ে উপরে থাকা **Restart** বাটনে ক্লিক করুন।  
২. এবার একটি নতুন ব্রাউজার ট্যাব খুলে আপনার ওয়েবসাইট ভিজিট করুন:  
   👉 `https://yourdomain.com/api/health`  
   - স্ক্রিনে যদি `{"ok":true}` দেখায়, তবে আপনার ডাটাবেস ও ব্যাকএন্ড ১০০% কানেক্টেড!  
৩. এবার আপনার মূল সাইট ভিজিট করুন:  
   👉 `https://yourdomain.com`  
   - আপনার স্টোরফ্রন্ট, প্রোডাক্ট, স্লাইডার সবকিছু চোখের সামনে চলে আসবে।
৪. এডমিন প্যানেলে লগইন করুন:  
   👉 `https://yourdomain.com/login`  
   - মোবাইল: `01700000000`  
   - পাসওয়ার্ড: `admin123`

---

### ধাপ ৮: ডেমো ডাটা বন্ধ করা (Production Mode)

যেহেতু প্রথমবার সাইট চালু হয়ে গেছে এবং ডাটাবেস রেডি:
১. cPanel → **Setup Node.js App**-এ যান।  
২. Environment Variables সেকশনে গিয়ে:
   - `AUTO_SEED`-এর ভ্যালু পরিবর্তন করে **`false`** করে দিন।  
   - `DEMO_DATA`-এর ভ্যালু **`false`** করে দিন (যদি আপনি টেস্ট প্রোডাক্ট মুছে দিয়ে ফ্রেশ ব্যবসা শুরু করতে চান)।
৩. **Save** চাপুন এবং অ্যাপটি একবার **Restart** দিন।

---

### ধাপ ৯ (বিকল্প পদ্ধতি ২): সার্ভারে সরাসরি Run JS script দিয়ে বিল্ড

আপনি যদি নিজের পিসিতে বিল্ড না করে পুরো র প্রজেক্ট ফাইল cPanel-এ আপলোড করে সেখানেই বিল্ড করতে চান:

১. cPanel **Setup Node.js App** পেজে যান।  
২. প্রথমে **Run NPM Install** বাটনে ক্লিক করুন।  
৩. এবার **Run JS script** বাটনে ক্লিক করুন:
   - ড্রপডাউন থেকে সিলেক্ট করুন: **`build:cpanel`**
   - নিচে `Specify parameters` ইনপুট বক্সটি **একেবারে খালি রাখবেন** (কিছুই লিখবেন না)।
   - **Run JS script** বাটনে চাপুন।
৪. আমাদের তৈরি করা `scripts/cpanel-build.cjs` স্ক্রিপ্টটি মেমরি সীমা (`--disable-wasm-trap-handler --max-old-space-size=3072 --webpack`) ম্যানেজ করে বিল্ড সম্পন্ন করে দেবে।
৫. বিল্ড শেষ হলে অ্যাপটি **Restart** দিন।

---

## 🛠️常见 সাধারণ সমস্যা ও এক নজরে সমাধান (FAQ)

| সমস্যা | সমাধান |
|---|---|
| **503 Service Unavailable** | Startup file ঠিক নেই অথবা `.next` বিল্ড ফোল্ডার মিসিং। Startup file-এ `scripts/cpanel-start.cjs` দিন এবং ধাপ ২ অনুযায়ী বিল্ড ফাইল আপলোড হয়েছে কিনা দেখুন। |
| **RangeError: WebAssembly.instantiate(): Out of memory** | এটি তখনই ঘটে যখন মেমরি অপ্টিমাইজেশন ছাড়া বিল্ড বা স্টার্ট চালানো হয়। পদ্ধতি ১ অনুযায়ী পিসিতে বিল্ড করে আপলোড করুন অথবা Startup file-এ `scripts/cpanel-start.cjs` ব্যবহার করুন। |
| **Could not find a production build in '.next'** | আপনি বিল্ড ছাড়া সরাসরি স্টার্ট দিয়েছেন। ধাপ ২ অনুযায়ী পিসিতে `npm run build` করে সেই `.next` ফোল্ডার cPanel-এ আপলোড করুন। |
| **লগইন হচ্ছে না বা সেশন আউট হয়ে যাচ্ছে** | `AUTH_SECRET`-এ লম্বা সিক্রেট কি দেওয়া আছে কিনা এবং আপনার সাইটে SSL (https) সক্রিয় কিনা যাচাই করুন। |
| **ডাটাবেস কানেকশন ফেইলড** | cPanel MySQL-এ ইউজারকে ডাটাবেসের সাথে যুক্ত করে **ALL PRIVILEGES** দেওয়া হয়েছে কিনা এবং `DB_USER` ও `DB_NAME`-এ প্রিফিক্স ঠিক আছে কিনা চেক করুন। |
