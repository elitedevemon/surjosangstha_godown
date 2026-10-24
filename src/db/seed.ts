import { db } from "@/db";
import {
  branches,
  users,
  categories,
  products,
  serviceAreas,
  orders,
  orderItems,
  godownSessions,
  godownMovements,
  notifications,
  settings,
  helpdeskKb,
  reviews,
} from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const px = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900`;

type IT = "daily" | "weekly" | "monthly";
interface BaseProduct {
  name: string;
  cat: string;
  brand: string;
  price: number;
  cash: number;
  it: IT;
  down: number;
  amt: number;
  count: number;
  images: string[];
  colors: string[];
  flags?: { featured?: boolean; hot?: boolean; best?: boolean; isNew?: boolean };
  desc: string;
  specs: { key: string; value: string }[];
  warranty: string;
}

const BASE: BaseProduct[] = [
  { name: "Walton Refrigerator 252L Frost", cat: "home-appliances", brand: "Walton", price: 42000, cash: 38500, it: "monthly", down: 6000, amt: 3000, count: 12, images: [px(11520752), px(19846397)], colors: ["Red", "Silver", "Blue"], flags: { featured: true, best: true }, desc: "শক্তি সাশ্রয়ী ইনভার্টার রেফ্রিজারেটর। বড় পরিবারের জন্য আদর্শ। ১২ বছরের কম্প্রেসর গ্যারান্টি।", specs: [{ key: "Capacity", value: "252 Litre" }, { key: "Type", value: "Frost / Inverter" }, { key: "Energy", value: "5 Star" }], warranty: "12 years compressor" },
  { name: "Singer Sewing Machine Classic", cat: "sewing-tailoring", brand: "Singer", price: 14500, cash: 12800, it: "weekly", down: 2500, amt: 500, count: 24, images: [px(27872045), px(27893063), px(7147450)], colors: ["Black", "White"], flags: { hot: true, best: true }, desc: "নারী উদ্যোক্তাদের জন্য সবচেয়ে জনপ্রিয় সেলাই মেশিন। সাপ্তাহিক মাত্র ৫০০ টাকা কিস্তিতে।", specs: [{ key: "Stitch", value: "Straight + Zigzag" }, { key: "Motor", value: "Electric + Manual" }], warranty: "2 years" },
  { name: 'Samsung 32" Smart LED TV', cat: "electronics", brand: "Samsung", price: 28000, cash: 25500, it: "monthly", down: 3000, amt: 2500, count: 10, images: [px(11520752), px(316598)], colors: ["Black"], flags: { featured: true, hot: true }, desc: "HD Smart TV with YouTube & Netflix. মাসিক কিস্তিতে ঘরে নিয়ে যান আজই।", specs: [{ key: "Size", value: "32 inch" }, { key: "Resolution", value: "HD Ready" }, { key: "Smart", value: "Tizen OS" }], warranty: "2 years panel" },
  { name: "Phoenix Bicycle 26 inch", cat: "bicycles-transport", brand: "Phoenix", price: 12500, cash: 11000, it: "daily", down: 2500, amt: 100, count: 100, images: [px(38863239)], colors: ["Red", "Black", "Green"], flags: { best: true }, desc: "মজবুত স্টিল ফ্রেম, দৈনিক মাত্র ১০০ টাকা কিস্তিতে। শিক্ষার্থী ও কর্মজীবীদের প্রথম পছন্দ।", specs: [{ key: "Frame", value: "Steel" }, { key: "Wheel", value: "26 inch" }], warranty: "1 year frame" },
  { name: "Symphony Z60 Smartphone", cat: "mobile-gadgets", brand: "Symphony", price: 15500, cash: 13900, it: "weekly", down: 2500, amt: 500, count: 26, images: [px(13844013), px(5077039)], colors: ["Blue", "Black", "Gold"], flags: { hot: true, isNew: true }, desc: "6.5\" HD+ display, 4GB RAM, 128GB storage, 5000mAh battery. সাপ্তাহিক কিস্তিতে স্মার্টফোন।", specs: [{ key: "RAM", value: "4 GB" }, { key: "Storage", value: "128 GB" }, { key: "Battery", value: "5000 mAh" }], warranty: "1 year" },
  { name: "Walton Washing Machine 7kg", cat: "home-appliances", brand: "Walton", price: 32000, cash: 29000, it: "monthly", down: 4400, amt: 2300, count: 12, images: [px(3935334), px(19846385), px(7282376)], colors: ["White", "Silver"], flags: { featured: true }, desc: "ফুললি অটোমেটিক টপ-লোড ওয়াশিং মেশিন। সময় বাঁচান, কাপড় থাকুক ঝকঝকে।", specs: [{ key: "Capacity", value: "7 KG" }, { key: "Type", value: "Top Load Automatic" }], warranty: "5 years motor" },
  { name: "HP 15s Core i3 Laptop", cat: "electronics", brand: "HP", price: 68000, cash: 62000, it: "monthly", down: 5600, amt: 5200, count: 12, images: [px(11129922), px(6032798), px(1350461)], colors: ["Silver"], flags: { featured: true, isNew: true }, desc: "12th Gen Core i3, 8GB RAM, 512GB SSD. শিক্ষার্থী ও ফ্রিল্যান্সারদের জন্য বিশেষ কিস্তি অফার।", specs: [{ key: "CPU", value: "Core i3 12th Gen" }, { key: "RAM", value: "8 GB" }, { key: "SSD", value: "512 GB" }], warranty: "2 years" },
  { name: "Premium Wooden Sofa Set (5 seat)", cat: "furniture", brand: "Hatil", price: 35000, cash: 31000, it: "monthly", down: 5000, amt: 3000, count: 10, images: [px(35516545), px(27872032)], colors: ["Brown", "Walnut"], flags: { featured: true }, desc: "সেগুন কাঠের তৈরি টেকসই সোফা সেট। আপনার ড্রয়িং রুমকে দিন আভিজাত্য।", specs: [{ key: "Material", value: "Segun wood" }, { key: "Seats", value: "3+1+1" }], warranty: "3 years" },
  { name: "Solar Home System 100W", cat: "solar-energy", brand: "Rahimafrooz", price: 18000, cash: 16000, it: "weekly", down: 3000, amt: 500, count: 30, images: ["/images/solar.jpg"], colors: ["Blue"], flags: { hot: true, best: true }, desc: "১০০ ওয়াট সোলার প্যানেল, ব্যাটারি, ৩টি LED লাইট ও মোবাইল চার্জিং সহ সম্পূর্ণ সিস্টেম।", specs: [{ key: "Panel", value: "100 Watt Mono" }, { key: "Battery", value: "60 Ah" }, { key: "Lights", value: "3 LED" }], warranty: "20 years panel" },
  { name: "Vision Rice Cooker 2.8L", cat: "home-appliances", brand: "Vision", price: 4200, cash: 3800, it: "weekly", down: 500, amt: 500, count: 8, images: ["/images/rice-cooker.jpg"], colors: ["Red", "White"], flags: { hot: true }, desc: "ডাবল পট রাইস কুকার, ৬-৮ জনের রান্নার জন্য উপযুক্ত। মাত্র ৮ সপ্তাহে কিস্তি শেষ।", specs: [{ key: "Capacity", value: "2.8 Litre" }, { key: "Power", value: "1000 W" }], warranty: "1 year" },
  { name: "Steel Almirah 3-Door", cat: "furniture", brand: "RFL", price: 16500, cash: 14800, it: "monthly", down: 2100, amt: 1800, count: 8, images: [px(27872032)], colors: ["Grey", "Cream"], desc: "মরিচা প্রতিরোধী পাউডার কোটেড স্টিল আলমারি, লকার সহ।", specs: [{ key: "Doors", value: "3" }, { key: "Locker", value: "Yes" }], warranty: "5 years" },
  { name: "Xiaomi Redmi Note 13", cat: "mobile-gadgets", brand: "Xiaomi", price: 24500, cash: 22000, it: "monthly", down: 2500, amt: 2200, count: 10, images: [px(30353224), px(30353223)], colors: ["Black", "Mint Green"], flags: { featured: true, best: true }, desc: "108MP camera, AMOLED display, 33W fast charging. মাসিক কিস্তিতে ফ্ল্যাগশিপ অভিজ্ঞতা।", specs: [{ key: "RAM", value: "8 GB" }, { key: "Storage", value: "256 GB" }, { key: "Camera", value: "108 MP" }], warranty: "1 year" },
  { name: "Walton Ceiling Fan 56 inch", cat: "home-appliances", brand: "Walton", price: 4800, cash: 4300, it: "daily", down: 800, amt: 50, count: 80, images: [px(19846397)], colors: ["White", "Brown"], desc: "উচ্চ বাতাসের গতি, কম বিদ্যুৎ খরচ। দৈনিক মাত্র ৫০ টাকা।", specs: [{ key: "Size", value: "56 inch" }, { key: "Power", value: "80 W" }], warranty: "5 years" },
  { name: "Hero Lectro E-Bike", cat: "bicycles-transport", brand: "Hero", price: 58000, cash: 52000, it: "monthly", down: 10000, amt: 4000, count: 12, images: [px(38863239)], colors: ["Black", "Blue"], flags: { isNew: true }, desc: "ইলেকট্রিক সাইকেল, এক চার্জে ৪০ কিমি। জ্বালানি খরচ ছাড়াই যাতায়াত।", specs: [{ key: "Range", value: "40 KM" }, { key: "Battery", value: "Li-ion 36V" }], warranty: "2 years battery" },
];

const CATS = [
  { name: "Electronics", slug: "electronics", icon: "📺", description: "TV, Laptop, Sound system" },
  { name: "Home Appliances", slug: "home-appliances", icon: "🧊", description: "Fridge, Washing machine, Fan" },
  { name: "Mobile & Gadgets", slug: "mobile-gadgets", icon: "📱", description: "Smartphones & accessories" },
  { name: "Furniture", slug: "furniture", icon: "🛋️", description: "Sofa, Almirah, Bed" },
  { name: "Bicycles & Transport", slug: "bicycles-transport", icon: "🚲", description: "Bicycles, E-bikes" },
  { name: "Sewing & Tailoring", slug: "sewing-tailoring", icon: "🧵", description: "Sewing machines" },
  { name: "Solar & Energy", slug: "solar-energy", icon: "☀️", description: "Solar home systems" },
];

function rand<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
let orderSeq = 1000;
function orderNo(d: Date) {
  orderSeq += 1;
  return `SS-${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${orderSeq}`;
}

export async function ensureCore() {
  const existing = await db.select().from(branches).limit(1);
  let mainBranch = existing[0];
  if (!mainBranch) {
    const [{ id: bid }] = await db
      .insert(branches)
      .values({ name: "Rangpur Main Branch", code: "RNG", address: "Station Road, Rangpur", district: "Rangpur", upazila: "Rangpur Sadar", phone: "01700000000", manager: "Head Office", lat: 25.7439, lng: 89.2752 })
      .$returningId();
    [mainBranch] = await db.select().from(branches).where(eq(branches.id, bid)).limit(1);
  }
  const adminPhone = process.env.ADMIN_PHONE ?? "01700000000";
  const [admin] = await db.select().from(users).where(eq(users.phone, adminPhone)).limit(1);
  if (!admin) {
    await db.insert(users).values({
      name: "Super Admin",
      phone: adminPhone,
      email: "admin@surjosangstha.com",
      passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD ?? "admin123", 10),
      role: "admin",
      branchId: mainBranch.id,
      designation: "Administrator",
      district: "Rangpur",
    });
  }
  return mainBranch;
}

export async function removeDemoData() {
  await db.delete(notifications);
  await db.delete(orders).where(eq(orders.isDemo, true));
  await db.delete(godownSessions).where(eq(godownSessions.isDemo, true));
  await db.delete(products).where(eq(products.isDemo, true));
  await db.delete(serviceAreas).where(eq(serviceAreas.isDemo, true));
  await db.delete(categories).where(eq(categories.isDemo, true));
  await db.delete(users).where(eq(users.isDemo, true));
  await db.delete(branches).where(eq(branches.isDemo, true));
}

export async function seedDemo() {
  const main = await ensureCore();
  await removeDemoData();
  const empHash = bcrypt.hashSync("employee123", 10);
  const cusHash = bcrypt.hashSync("customer123", 10);

  await db
    .insert(branches)
    .values([
      { name: "Dinajpur Branch", code: "DNJ", address: "Bahadur Bazar, Dinajpur", district: "Dinajpur", upazila: "Dinajpur Sadar", phone: "01700000002", manager: "Md. Faruk Hossain", lat: 25.6217, lng: 88.6354, isDemo: true },
      { name: "Bogura Branch", code: "BOG", address: "Satmatha, Bogura", district: "Bogura", upazila: "Bogura Sadar", phone: "01700000003", manager: "Md. Abdul Kader", lat: 24.8465, lng: 89.3773, isDemo: true },
    ]);
  const [b2, b3] = await db.select().from(branches).where(inArray(branches.code, ["DNJ", "BOG"])).orderBy(branches.code);
  const allBranches = [main, b2, b3];

  await db.insert(categories).values(CATS.map((c, i) => ({ ...c, sortOrder: i, isDemo: true })));
  const cats = await db.select().from(categories).where(inArray(categories.slug, CATS.map((c) => c.slug))).orderBy(categories.sortOrder);
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  await db.insert(serviceAreas).values([
    { branchId: main.id, district: "Rangpur", isDemo: true, lat: 25.7439, lng: 89.2752 },
    { branchId: main.id, district: "Dinajpur", upazila: "Parbatipur", isDemo: true, lat: 25.66, lng: 88.92 },
    { branchId: b2.id, district: "Dinajpur", upazila: "Dinajpur Sadar", isDemo: true, lat: 25.6217, lng: 88.6354 },
    { branchId: b2.id, district: "Dinajpur", upazila: "Birganj", isDemo: true, lat: 25.86, lng: 88.65 },
    { branchId: b2.id, district: "Dinajpur", upazila: "Fulbari", isDemo: true, lat: 25.5, lng: 88.94 },
    { branchId: b3.id, district: "Bogura", isDemo: true, lat: 24.8465, lng: 89.3773 },
    { branchId: b3.id, district: "Rajshahi", upazila: "Puthia", isDemo: true, lat: 24.36, lng: 88.84 },
  ].map((r) => ({ ...r })));

  await db
    .insert(users)
    .values([
      { name: "Rahim Uddin", phone: "01711000001", role: "employee", branchId: main.id, passwordHash: empHash, designation: "Field Sales Officer", district: "Rangpur", upazila: "Rangpur Sadar", union: "Chandanpat", village: "Chandanpat", salary: 15000, nid: "1990123456789", joinedAt: new Date("2023-02-01"), isDemo: true },
      { name: "Karim Mia", phone: "01711000002", role: "employee", branchId: main.id, passwordHash: empHash, designation: "Field Sales Officer", district: "Rangpur", upazila: "Mithapukur", union: "Ranipukur", village: "Ranipukur", salary: 14000, nid: "1992123456780", joinedAt: new Date("2023-06-15"), isDemo: true },
      { name: "Jahangir Alam", phone: "01711000003", role: "employee", branchId: b2.id, passwordHash: empHash, designation: "Senior Sales Officer", district: "Dinajpur", upazila: "Dinajpur Sadar", union: "Auliapur", village: "Auliapur", salary: 17000, nid: "1988123456781", joinedAt: new Date("2022-11-10"), isDemo: true },
      { name: "Sumon Hossain", phone: "01711000004", role: "employee", branchId: b3.id, passwordHash: empHash, designation: "Field Sales Officer", district: "Bogura", upazila: "Sherpur", union: "Garidaha", village: "Garidaha", salary: 15000, nid: "1995123456782", joinedAt: new Date("2024-01-05"), isDemo: true },
      { name: "Nasrin Akter", phone: "01711000005", role: "employee", branchId: b3.id, passwordHash: empHash, designation: "Field Sales Officer", district: "Bogura", upazila: "Bogura Sadar", union: "Gokul", village: "Gokul", salary: 15000, nid: "1996123456783", joinedAt: new Date("2024-03-20"), isDemo: true },
    ]);
  const employees = await db.select().from(users).where(inArray(users.phone, ["01711000001", "01711000002", "01711000003", "01711000004", "01711000005"])).orderBy(users.id);

  await db
    .insert(users)
    .values([
      { name: "Abdul Malek", phone: "01811000001", uniqueId: "CUS-1001", role: "customer", passwordHash: cusHash, district: "Rangpur", upazila: "Mithapukur", union: "Ranipukur", village: "Purba Ranipukur", isDemo: true },
      { name: "Fatema Begum", phone: "01811000002", uniqueId: "CUS-1002", role: "customer", passwordHash: cusHash, district: "Rangpur", upazila: "Rangpur Sadar", union: "Haridebpur", village: "Haridebpur", isDemo: true },
      { name: "Mizanur Rahman", phone: "01811000003", role: "customer", passwordHash: cusHash, district: "Dinajpur", upazila: "Birganj", union: "Maricha", village: "Maricha Bazar", isDemo: true },
      { name: "Shirin Sultana", phone: "01811000004", role: "customer", passwordHash: cusHash, district: "Dinajpur", upazila: "Dinajpur Sadar", union: "Sekhpura", village: "Sekhpura", isDemo: true },
      { name: "Rafiqul Islam", phone: "01811000005", role: "customer", passwordHash: cusHash, district: "Bogura", upazila: "Sherpur", union: "Mirzapur", village: "Mirzapur", isDemo: true },
      { name: "Hasina Khatun", phone: "01811000006", role: "customer", passwordHash: cusHash, district: "Bogura", upazila: "Shibganj", union: "Kichak", village: "Kichak Bazar", isDemo: true },
      { name: "Tanvir Ahmed", phone: "01811000007", role: "customer", passwordHash: cusHash, district: "Dhaka", upazila: "Savar", union: "Ashulia", village: "Ashulia", isDemo: true },
      { name: "Sabina Yasmin", phone: "01811000008", role: "customer", passwordHash: cusHash, district: "Rangpur", upazila: "Pirgachha", union: "Kaikuri", village: "Kaikuri", isDemo: true },
    ]);
  const customers = await db.select().from(users).where(inArray(users.phone, ["01811000001", "01811000002", "01811000003", "01811000004", "01811000005", "01811000006", "01811000007", "01811000008"])).orderBy(users.id);

  // Products: each branch gets a subset with own stock
  const branchSets: Record<string, number[]> = {
    [main.code]: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    [b2.code]: [0, 1, 2, 3, 4, 8, 9, 10, 12],
    [b3.code]: [1, 2, 4, 5, 6, 7, 8, 9, 11, 13],
  };
  const created: (typeof products.$inferSelect)[] = [];
  for (const b of allBranches) {
    const rows = branchSets[b.code].map((i) => {
      const p = BASE[i];
      const days = i * 3 + ri(0, 40);
      const createdAt = new Date(Date.now() - days * 86400000);
      return {
        branchId: b.id,
        categoryId: catId(p.cat),
        name: p.name,
        slug: `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${b.code.toLowerCase()}`,
        sku: `${b.code}-${String(i + 1).padStart(3, "0")}`,
        brand: p.brand,
        description: p.desc,
        price: p.price,
        cashPrice: p.cash,
        minSellPrice: Math.round(p.cash * 0.95),
        installmentType: p.it,
        downPayment: p.down,
        installmentAmount: p.amt,
        installmentCount: p.count,
        firstInstallmentAfterDays: p.it === "daily" ? 1 : p.it === "weekly" ? 7 : 30,
        stock: ri(4, 40),
        godownStock: ri(6, 20),
        lowStockAt: 5,
        images: p.images,
        colors: p.colors,
        specs: p.specs,
        warranty: p.warranty,
        isFeatured: !!p.flags?.featured,
        isHot: !!p.flags?.hot,
        isBestSeller: !!p.flags?.best,
        isNew: !!p.flags?.isNew,
        rating: [4.2, 4.5, 4.7, 4.8, 4.9][ri(0, 4)],
        views: ri(50, 900),
        isDemo: true,
        createdAt,
      };
    });
    await db.insert(products).values(rows.map((r) => ({ ...r })));
    const ins = await db.select().from(products).where(inArray(products.slug, rows.map((r) => r.slug))).orderBy(products.id);
    created.push(...ins);
  }

  // Godown sessions + employee sales over last 12 days
  const soldCount = new Map<number, number>();
  for (const emp of employees) {
    const branchProducts = created.filter((p) => p.branchId === emp.branchId);
    for (let back = 12; back >= 1; back--) {
      if (ri(0, 9) < 2) continue; // some off days
      const date = new Date();
      date.setDate(date.getDate() - back);
      date.setHours(8, ri(0, 59));
      const [{ id: sid }] = await db
        .insert(godownSessions)
        .values({ branchId: emp.branchId!, employeeId: emp.id, date: dayKey(date), status: "closed", createdAt: date, closedAt: new Date(date.getTime() + 9 * 3600000), isDemo: true })
        .$returningId();
      const [session] = await db.select().from(godownSessions).where(eq(godownSessions.id, sid)).limit(1);
      const picks = [...branchProducts].sort(() => Math.random() - 0.5).slice(0, ri(3, 5));
      const taken = picks.map((p) => ({ p, qty: ri(1, 3) }));
      await db.insert(godownMovements).values(taken.map((t) => ({ sessionId: session.id, productId: t.p.id, productName: t.p.name, type: "take" as const, quantity: t.qty, unitPrice: t.p.cashPrice, createdAt: date })));
      let takenValue = 0, takenQty = 0, soldValue = 0, soldQty = 0, cashCollected = 0;
      taken.forEach((t) => { takenValue += t.qty * t.p.cashPrice; takenQty += t.qty; });
      const remaining = new Map(taken.map((t) => [t.p.id, t.qty]));
      const salesCount = ri(1, 3);
      for (let s = 0; s < salesCount; s++) {
        const avail = taken.filter((t) => (remaining.get(t.p.id) ?? 0) > 0);
        if (!avail.length) break;
        const t = rand(avail);
        const qty = 1;
        remaining.set(t.p.id, (remaining.get(t.p.id) ?? 0) - qty);
        const cust = rand(customers.filter((c) => c.district === emp.district) .length ? customers.filter((c) => c.district === emp.district) : customers);
        const isCash = Math.random() < 0.35;
        const unitPrice = isCash ? t.p.cashPrice : t.p.price;
        const total = unitPrice * qty;
        const when = new Date(date.getTime() + ri(1, 8) * 3600000);
        const [{ id: oId }] = await db
          .insert(orders)
          .values({
            orderNumber: orderNo(when), branchId: emp.branchId!, customerId: cust.id, employeeId: emp.id, sessionId: session.id,
            type: isCash ? "cash" : "installment", status: "accepted", source: "employee", subtotal: total, total,
            downPayment: isCash ? 0 : t.p.downPayment, paidAmount: isCash ? total : t.p.downPayment,
            installmentType: isCash ? null : t.p.installmentType, installmentAmount: isCash ? 0 : t.p.installmentAmount, installmentCount: isCash ? 0 : t.p.installmentCount,
            customerName: cust.name, customerPhone: cust.phone, village: cust.village, union: cust.union, upazila: cust.upazila, district: cust.district,
            isDemo: true, createdAt: when, updatedAt: when,
          })
          .$returningId();
        await db.insert(orderItems).values({ orderId: oId, productId: t.p.id, productName: t.p.name, image: t.p.images[0], color: t.p.colors[0], quantity: qty, unitPrice, lineTotal: total });
        soldValue += total; soldQty += qty; cashCollected += isCash ? total : t.p.downPayment;
        soldCount.set(t.p.id, (soldCount.get(t.p.id) ?? 0) + qty);
      }
      let returnedValue = 0, returnedQty = 0;
      const returns = taken.filter((t) => (remaining.get(t.p.id) ?? 0) > 0);
      if (returns.length) {
        await db.insert(godownMovements).values(returns.map((t) => ({ sessionId: session.id, productId: t.p.id, productName: t.p.name, type: "return" as const, quantity: remaining.get(t.p.id)!, unitPrice: t.p.cashPrice, createdAt: new Date(date.getTime() + 9 * 3600000) })));
        returns.forEach((t) => { returnedValue += remaining.get(t.p.id)! * t.p.cashPrice; returnedQty += remaining.get(t.p.id)!; });
      }
      await db.update(godownSessions).set({ takenValue, takenQty, soldValue, soldQty, returnedValue, returnedQty, cashCollected }).where(eq(godownSessions.id, session.id));
    }
  }

  // Online customer orders (COD / cash / installment) with mixed statuses
  const statuses = ["pending", "pending", "accepted", "accepted", "accepted", "delivered", "rejected"] as const;
  for (let i = 0; i < 28; i++) {
    const cust = rand(customers);
    const p = rand(created);
    const status = rand([...statuses]);
    const outside = cust.district === "Dhaka";
    const type = outside ? "cod" : rand(["installment", "installment", "cash", "cod"] as const);
    const qty = ri(1, 2);
    const unitPrice = type === "installment" ? p.price : p.cashPrice;
    const total = unitPrice * qty;
    const when = new Date(Date.now() - ri(0, 20) * 86400000 - ri(0, 20) * 3600000);
    const [{ id: oId }] = await db
      .insert(orders)
      .values({
        orderNumber: orderNo(when), branchId: p.branchId, customerId: cust.id, type, status, source: "online", subtotal: total, total,
        downPayment: type === "installment" ? p.downPayment : 0, paidAmount: status === "delivered" ? (type === "installment" ? p.downPayment : total) : 0,
        installmentType: type === "installment" ? p.installmentType : null, installmentAmount: type === "installment" ? p.installmentAmount : 0, installmentCount: type === "installment" ? p.installmentCount : 0,
        customerName: cust.name, customerPhone: cust.phone, village: cust.village, union: cust.union, upazila: cust.upazila, district: cust.district, address: `${cust.village}, ${cust.upazila}`,
        notes: i % 4 === 0 ? "দয়া করে বিকালে ডেলিভারি দিবেন" : null, isDemo: true, createdAt: when, updatedAt: when,
      })
      .$returningId();
    await db.insert(orderItems).values({ orderId: oId, productId: p.id, productName: p.name, image: p.images[0], color: rand(p.colors), quantity: qty, unitPrice, lineTotal: total });
    if (status === "accepted" || status === "delivered") soldCount.set(p.id, (soldCount.get(p.id) ?? 0) + qty);
  }
  for (const [pid, count] of soldCount) {
    await db.update(products).set({ soldCount: count }).where(eq(products.id, pid));
  }

  await db.insert(settings).values({
    id: 1, siteName: "SurjoSangstha", deliveryFeeIn: 0, deliveryFeeOut: 60, reviewsAutoShow: false,
    bannerUrl: null, logoUrl: null, faviconUrl: null,
  }).onDuplicateKeyUpdate({ set: { siteName: "SurjoSangstha" } });

  await db.insert(helpdeskKb).values([
    { question: "ডেলিভারি চার্জ কত?", answer: "সার্ভিস এলাকার ভিতরে ডেলিভারি ফ্রি, এলাকার বাইরে ৳৬।" },
    { question: "কিস্তি কিভাবে নিব?", answer: "মাঠ প্রতিনিধির মাধ্যমে ডাউন পেমেন্ট দিয়ে কিস্তিতে পণ্য নিতে পারবেন। অনলাইনে অর্ডার করলে ক্যাশ অন ডেলিভারি প্রযোজ্য।" },
  ]);

  await db.insert(notifications).values([
    { branchId: main.id, recipientRole: "admin", type: "order", title: "নতুন অনলাইন অর্ডার", message: "Abdul Malek একটি কিস্তির অর্ডার করেছেন (Walton Refrigerator)", link: "/admin/orders" },
    { branchId: b2.id, recipientRole: "admin", type: "godown", title: "গোডাউন হিসাব ক্লোজ", message: "Jahangir Alam আজকের গোডাউন হিসাব চূড়ান্ত জমা দিয়েছেন", link: "/admin/godown" },
    { branchId: b3.id, recipientRole: "admin", type: "stock", title: "স্টক কম", message: "Bogura শাখায় Singer Sewing Machine এর স্টক ৫ এর নিচে", link: "/admin/godown" },
  ]);
}

export async function seedIfNeeded() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(branches);
  const demo = (process.env.DEMO_DATA ?? "true") !== "false";
  if (Number(count) === 0) {
    await ensureCore();
    if (demo) await seedDemo();
    return "seeded";
  }
  if (!demo) {
    const [{ demoCount }] = await db.select({ demoCount: sql<number>`count(*)` }).from(products).where(eq(products.isDemo, true));
    if (Number(demoCount) > 0) {
      await removeDemoData();
      return "demo-removed";
    }
  }
  return "skipped";
}
