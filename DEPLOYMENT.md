# 🚀 ডিপ্লয়মেন্ট — দ্রুত রেফারেন্স

বিস্তারিত ধাপে ধাপে গাইড এখন **`instructions/`** ফোল্ডারে:

## 🆓 ফ্রি ডিপ্লয় (টেস্টিং, ২–৩ মাস)
→ **[instructions/production.md](./instructions/production.md)**

GitHub + Aiven (ফ্রি MySQL) + Render (ফ্রি অ্যাপ হোস্টিং)।
কোনো কার্ড বা কাস্টম ডোমেইন লাগে না; সাইট পাবেন: `surjosangstha.onrender.com`

## 💳 পেইড ডিপ্লয় (টেস্টিং শেষে)
→ **[instructions/cpanel.md](./instructions/cpanel.md)**

Node.js-সাপোর্টেড cPanel হোস্টিং বা VPS + নিজের ডোমেইন;
ফ্রি Aiven থেকে ডাটা মাইগ্রেশনের গাইডসহ।

## 🔔 রিয়েল-টাইম
→ **[instructions/pusher-pushnotification.md](./instructions/pusher-pushnotification.md)**

## ❌ InfinityFree / শুধু-PHP হোস্টিং
**এই অ্যাপ চলবে না** (Node.js নেই, বাইরে থেকে MySQL খোলে না)।
কারণ ও বিকল্প: [production.md শুরুর অংশ](./instructions/production.md)।

## ⚡ ৬০ সেকেন্ডে ফ্রি ডিপ্লয়ের সারসংক্ষেপ
1. GitHub রিপোতে কোড আপলোড (`node_modules`, `.next`, `.env` বাদে)
2. Aiven ফ্রি MySQL সার্ভিস তৈরি → Host/Port/User/Password নিন
3. Render → New Web Service → repo connect → Build `npm install && npm run build`, Start `npm start`
4. Environment Variables (`DB_*`, `AUTH_SECRET`, `DEMO_DATA=false`, `AUTO_SEED=true`, `COOKIE_SECURE=true`)
5. ডিপ্লয়ের পর `AUTO_SEED=false` করুন
6. cron-job.org-এ প্রতি ১০ মিনিটে `/api/ping` পিং করুন (ঘুম বন্ধ)
