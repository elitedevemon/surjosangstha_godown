# 📚 সেটআপ ও ইনস্টলেশন গাইড

> সব ধাপে ধাপে গাইড এখন **`instructions/`** ফোল্ডারে আছে — **[👉 শুরু করুন এখান থেকে: instructions/README.md](./instructions/README.md)**

## 📂 গাইডসমূহ

| ফাইল | কী আছে |
|---|---|
| [instructions/README.md](./instructions/README.md) | সূচি ও দ্রুত শুরু (Quick Start) |
| [instructions/local.md](./instructions/local.md) | নিজের কম্পিউটারে ইনস্টল ও চালানো |
| [instructions/universal-setup.md](./instructions/universal-setup.md) | লোকাল + লাইভ উভয়ের সাধারণ সেটআপ, পুরো env রেফারেন্স |
| [instructions/production.md](./instructions/production.md) | **ফ্রি** লাইভ ডিপ্লয়: GitHub + Aiven + Render (কোনো ডোমেইন/কার্ড লাগে না) |
| [instructions/cpanel.md](./instructions/cpanel.md) | **পেইড** হোস্টিং: Node.js cPanel ও VPS, ফ্রি থেকে ডাটা মাইগ্রেশন |
| [instructions/pusher-pushnotification.md](./instructions/pusher-pushnotification.md) | Pusher রিয়েল-টাইম ও Web Push নোটিফিকেশন |

## ⚡ ৬০ সেকেন্ডে লোকাল

```bash
npm install
# XAMPP-তে MySQL চালু করে ss_db ডাটাবেস বানান
npx drizzle-kit push --force
npx tsx src/db/seed-cli.ts --force
npm run dev    # http://localhost:3000
```

## ⚠️ মনে রাখবেন
- **InfinityFree/শুধু-PHP হোস্টিং এ অ্যাপ চলবে না** — Node.js লাগে; বিনামূল্যে **Render** ব্যবহার করুন
- `.env` কখনো GitHub-এ আপলোড করবেন না
- ডিফল্ট এডমিন: `01700000000` / `admin123` (লাইভে বদলে নিন)

## 🔗 অন্যান্য
- ডিপ্লয়মেন্ট বিকল্পের সংক্ষিপ্ত তুলনা: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## ১০. cPanel ও সীমিত মেমরি হোস্টিংয়ে WebAssembly OOM ফিক্স

নরমাল Next.js এবং compilations-এর সময় Shared cPanel বা সীমিত ভার্চুয়াল মেমরির হোস্টিংয়ে নিচের এররটি আসতে পারে:
```
unhandledRejection RangeError: WebAssembly.instantiate(): Out of memory: Cannot allocate Wasm memory for new instance
```

### কেন হয়?
Node.js v20.15.0+ এবং v22.2.0+ সংস্করণে WebAssembly-র ট্র্যাপ-হ্যান্ডলার অপ্টিমাইজেশন ডিফল্টভাবে চালু থাকে। এটি প্রতিটি Wasm ইনসট্যান্সের জন্য **১০ গিগাবাইট** ভার্চুয়াল মেমরি এড্রেস স্পেস রিজার্ভ করার চেষ্টা করে। CloudLinux cPanel বা সীমিত মেমরির হোস্টিংয়ে (যেমন LVE limits-এ address space বা `ulimit -v` ৪GB ক্যাপ করা থাকলে) এই রিজার্ভেশন ফেইল করে এবং Out of Memory এরর দেখায়।

### সমাধান (যা এই প্রজেক্টে ইতিমধ্যে করা হয়েছে):
প্রজেক্টের `package.json` স্ক্রিপ্টে এবং রানটাইম এনভায়রনমেন্টে V8-এর ট্র্যাপ-হ্যান্ডলার নিষ্ক্রিয়কারী ফ্ল্যাগটি যুক্ত করা হয়েছে:
```json
"scripts": {
  "dev": "cross-env NODE_OPTIONS=\"--disable-wasm-trap-handler\" next dev",
  "build": "cross-env NODE_OPTIONS=\"--disable-wasm-trap-handler\" next build",
  "start": "cross-env NODE_OPTIONS=\"--disable-wasm-trap-handler\" next start"
}
```
এটি করার ফলে Wasm সাধারণ বাউন্ডস-চেক পদ্ধতি ব্যবহার করে, যা ১০GB ভার্চুয়াল মেমরি খাঁচা ছাড়াই যেকোনো কম মেমরির (৫১২MB/১GB RAM) শেয়ার্ড cPanel হোস্টিংয়ে Next.js বিল্ড এবং রান করতে সাহায্য করে।

প্রোডাকশন হোস্টিংয়ে কোনো সমস্যা হলে এনভায়রনমেন্ট ভ্যারিয়েবলেও এটি সেট রাখতে পারেন:
```env
NODE_OPTIONS=--disable-wasm-trap-handler
```
গাইড: [`cpanel.md`](./instructions/cpanel.md) এবং [`production.md`](./instructions/production.md) উভয়ে এই বিষয়ে দিকনির্দেশনা যোগ করা হয়েছে।
