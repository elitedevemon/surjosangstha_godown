# 💳 cPanel-এ SurjoSangstha ডিপ্লয়মেন্ট গাইড

বিস্তারিত স্টেপ-বাই-স্টেপ গাইড দেখতে [instructions/cpanel.md](./instructions/cpanel.md) ফাইলটি দেখুন।

### এক নজরে মূল পয়েন্টগুলো:
1. **503 Service Unavailable** ও **Could not find a production build in .next** এরর দূর করতে:
   - আপনার পিসিতে `BUILD_STANDALONE=true npm run build` চালিয়ে তৈরি হওয়া `.next/standalone`, `.next/static`, এবং `public` ফোল্ডারসহ cPanel-এ আপলোড করুন।
   - cPanel Setup Node.js App-এ **Application startup file** হিসেবে দিন: `scripts/cpanel-start.cjs`
2. **Run JS script** ব্যবহার করতে চাইলে:
   - স্ক্রিপ্ট লিস্ট থেকে নির্বাচন করুন `build:cpanel` এবং parameters বক্সটি খালি রাখুন।
3. ডাটাবেসের জন্য cPanel MySQL-এ ইউজার ও ডাটাবেস বানিয়ে `DB_HOST=localhost`, `DB_USER=cpanel_user`, `DB_NAME=cpanel_db`, `DB_PASSWORD=xxx`, `DB_SSL=false` এনভায়রনমেন্ট ভেরিয়েবলে সেট করুন।
4. প্রথমবার অ্যাপ স্টার্টের সময় `AUTO_SEED=true` রাখবেন যাতে এডমিন একাউন্ট ও টেবিল স্বয়ংক্রিয়ভাবে তৈরি হয়ে যায়, পরে `false` করে দিন।
