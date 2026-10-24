import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/mysql-core";
import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  double,
  json,
  boolean,
  index,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

const dt = () => datetime({ mode: "date" });

export const roleEnum = () => mysqlEnum("role", ["admin", "employee", "customer"]);
export const recipientRoleEnum = () => mysqlEnum("recipient_role", ["admin", "employee", "customer"]);
export const installmentTypeEnum = () => mysqlEnum("installment_type", ["daily", "weekly", "monthly"]);
export const orderTypeEnum = () => mysqlEnum("type", ["cod", "cash", "installment"]);
export const orderStatusEnum = () => mysqlEnum("status", ["pending", "accepted", "rejected", "delivered", "cancelled"]);
export const orderSourceEnum = () => mysqlEnum("source", ["online", "employee"]);
export const movementTypeEnum = () => mysqlEnum("type", ["take", "claim", "return"]);
export const sessionStatusEnum = () => mysqlEnum("status", ["open", "closed"]);

export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  address: text("address"),
  district: varchar("district", { length: 100 }),
  upazila: varchar("upazila", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  manager: varchar("manager", { length: 191 }),
  lat: double("lat"),
  lng: double("lng"),
  isActive: boolean("is_active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: dt().notNull().default(sql`current_timestamp()`),
});

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 191 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    email: varchar("email", { length: 191 }),
    passwordHash: text("password_hash"),
    role: roleEnum().notNull().default("customer"),
    branchId: int("branch_id").references(() => branches.id, { onDelete: "set null" }),
    village: varchar("village", { length: 100 }),
    union: varchar("union", { length: 100 }),
    upazila: varchar("upazila", { length: 100 }),
    district: varchar("district", { length: 100 }),
    address: text("address"),
    avatar: text("avatar"),
    uniqueId: varchar("unique_id", { length: 24 }).unique(),
    blocked: boolean("blocked").notNull().default(false),
    designation: varchar("designation", { length: 191 }),
    nid: varchar("nid", { length: 20 }),
    salary: int("salary"),
    joinedAt: dt(),
    isActive: boolean("is_active").notNull().default(true),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [index("users_role_idx").on(t.role), index("users_branch_idx").on(t.branchId)],
);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  slug: varchar("slug", { length: 191 }).notNull().unique(),
  icon: varchar("icon", { length: 32 }),
  image: text("image"),
  description: text("description"),
  sortOrder: int("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    branchId: int("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
    name: varchar("name", { length: 191 }).notNull(),
    slug: varchar("slug", { length: 191 }).notNull().unique(),
    sku: varchar("sku", { length: 64 }),
    brand: varchar("brand", { length: 100 }),
    description: text("description"),
    price: int("price").notNull(),
    cashPrice: int("cash_price").notNull(),
    minSellPrice: int("min_sell_price"),
    installmentType: installmentTypeEnum().notNull().default("monthly"),
    downPayment: int("down_payment").notNull().default(0),
    installmentAmount: int("installment_amount").notNull().default(0),
    installmentCount: int("installment_count").notNull().default(0),
    firstInstallmentAfterDays: int("first_installment_after_days").notNull().default(7),
    stock: int("stock").notNull().default(0),
    godownStock: int("godown_stock").notNull().default(0),
    lowStockAt: int("low_stock_at").notNull().default(5),
    images: json("images").$type<string[]>().notNull(),
    colors: json("colors").$type<string[]>().notNull(),
    specs: json("specs").$type<{ key: string; value: string }[]>().notNull(),
    warranty: varchar("warranty", { length: 191 }),
    isFeatured: boolean("is_featured").notNull().default(false),
    isHot: boolean("is_hot").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isNew: boolean("is_new").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    soldCount: int("sold_count").notNull().default(0),
    views: int("views").notNull().default(0),
    rating: double("rating").notNull().default(4.5),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [index("products_branch_idx").on(t.branchId), index("products_category_idx").on(t.categoryId)],
);

export const serviceAreas = mysqlTable("service_areas", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  district: varchar("district", { length: 100 }).notNull(),
  upazila: varchar("upazila", { length: 100 }),
  union: varchar("union", { length: 100 }),
  village: varchar("village", { length: 100 }),
  lat: double("lat"),
  lng: double("lng"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: dt().notNull().default(sql`current_timestamp()`),
});

export const godownSessions = mysqlTable(
  "godown_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: varchar("client_id", { length: 64 }).unique(),
    branchId: int("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    employeeId: int("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(),
    status: sessionStatusEnum().notNull().default("open"),
    takenValue: int("taken_value").notNull().default(0),
    claimedValue: int("claimed_value").notNull().default(0),
    soldValue: int("sold_value").notNull().default(0),
    returnedValue: int("returned_value").notNull().default(0),
    takenQty: int("taken_qty").notNull().default(0),
    soldQty: int("sold_qty").notNull().default(0),
    returnedQty: int("returned_qty").notNull().default(0),
    cashCollected: int("cash_collected").notNull().default(0),
    note: text("note"),
    closedAt: dt(),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [index("sessions_employee_idx").on(t.employeeId), index("sessions_branch_idx").on(t.branchId)],
);

export const godownMovements = mysqlTable(
  "godown_movements",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: varchar("client_id", { length: 128 }).unique(),
    sessionId: int("session_id").notNull().references(() => godownSessions.id, { onDelete: "cascade" }),
    productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    productName: varchar("product_name", { length: 191 }).notNull(),
    type: movementTypeEnum().notNull(),
    quantity: int("quantity").notNull(),
    unitPrice: int("unit_price").notNull(),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [index("movements_session_idx").on(t.sessionId)],
);

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    orderNumber: varchar("order_number", { length: 40 }).notNull().unique(),
    clientId: varchar("client_id", { length: 64 }).unique(),
    branchId: int("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    customerId: int("customer_id").references(() => users.id, { onDelete: "set null" }),
    employeeId: int("employee_id").references(() => users.id, { onDelete: "set null" }),
    sessionId: int("session_id").references(() => godownSessions.id, { onDelete: "set null" }),
    type: orderTypeEnum().notNull(),
    status: orderStatusEnum().notNull().default("pending"),
    source: orderSourceEnum().notNull().default("online"),
    packageId: int("package_id"),
    deliveryFee: int("delivery_fee").notNull().default(0),
    discount: int("discount").notNull().default(0),
    subtotal: int("subtotal").notNull().default(0),
    total: int("total").notNull().default(0),
    downPayment: int("down_payment").notNull().default(0),
    paidAmount: int("paid_amount").notNull().default(0),
    installmentType: installmentTypeEnum(),
    installmentAmount: int("installment_amount").notNull().default(0),
    installmentCount: int("installment_count").notNull().default(0),
    customerName: varchar("customer_name", { length: 191 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
    village: varchar("village", { length: 100 }),
    union: varchar("union", { length: 100 }),
    upazila: varchar("upazila", { length: 100 }),
    district: varchar("district", { length: 100 }),
    address: text("address"),
    notes: text("notes"),
    adminNote: text("admin_note"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
    updatedAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [
    index("orders_branch_idx").on(t.branchId),
    index("orders_customer_idx").on(t.customerId),
    index("orders_employee_idx").on(t.employeeId),
    index("orders_status_idx").on(t.status),
  ],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: int("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: varchar("product_name", { length: 191 }).notNull(),
    image: text("image"),
    color: varchar("color", { length: 64 }),
    quantity: int("quantity").notNull(),
    unitPrice: int("unit_price").notNull(),
    lineTotal: int("line_total").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId), index("order_items_product_idx").on(t.productId)],
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    branchId: int("branch_id").references(() => branches.id, { onDelete: "cascade" }),
    recipientRole: recipientRoleEnum().notNull().default("admin"),
    recipientId: int("recipient_id").references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 40 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    link: varchar("link", { length: 255 }),
    data: json("data").$type<Record<string, unknown>>(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [index("notifications_role_idx").on(t.recipientRole), index("notifications_created_idx").on(t.createdAt)],
);


export const requestStatusEnum = () => mysqlEnum("status", ["pending", "approved", "rejected", "listed"]);
export const reviewStatusEnum = () => mysqlEnum("status", ["pending", "approved", "hidden"]);
export const packageStatusEnum = () => mysqlEnum("status", ["saved", "sold", "accepted", "rejected"]);
export const msgSenderEnum = () => mysqlEnum("sender", ["customer", "admin"]);

export const reviews = mysqlTable(
  "reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    customerId: int("customer_id").references(() => users.id, { onDelete: "set null" }),
    customerName: varchar("customer_name", { length: 191 }).notNull(),
    rating: int("rating").notNull().default(5),
    comment: text("comment").notNull(),
    status: reviewStatusEnum().notNull().default("pending"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [index("reviews_product_idx").on(t.productId), index("reviews_status_idx").on(t.status)],
);

/** Singleton row (id=1): storefront + pusher + delivery fee settings. */
export const settings = mysqlTable("settings", {
  id: int("id").primaryKey(),
  siteName: varchar("site_name", { length: 191 }).notNull().default("SurjoSangstha"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  bannerUrl: text("banner_url"),
  heroTitle: varchar("hero_title", { length: 255 }),
  pusherAppId: varchar("pusher_app_id", { length: 191 }),
  pusherKey: varchar("pusher_key", { length: 191 }),
  pusherSecret: varchar("pusher_secret", { length: 191 }),
  pusherCluster: varchar("pusher_cluster", { length: 40 }),
  deliveryFeeIn: int("delivery_fee_in").notNull().default(0),
  deliveryFeeOut: int("delivery_fee_out").notNull().default(60),
  reviewsAutoShow: boolean("reviews_auto_show").notNull().default(false),
  openrouterKey: varchar("openrouter_key", { length: 191 }),
  openrouterModel: varchar("openrouter_model", { length: 120 }),
  aiHelpdesk: boolean("ai_helpdesk").notNull().default(false),
  updatedAt: dt().notNull().default(sql`current_timestamp()`),
});

export const packages = mysqlTable(
  "packages",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: varchar("client_id", { length: 64 }).unique(),
    branchId: int("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    employeeId: int("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 191 }).notNull(),
    items: json("items").$type<{ productId: number; qty: number; unitPrice: number }[]>().notNull(),
    price: int("price").notNull().default(0),
    status: packageStatusEnum().notNull().default("saved"),
    orderId: int("order_id"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [index("packages_employee_idx").on(t.employeeId)],
);

export const helpdeskThreads = mysqlTable(
  "helpdesk_threads",
  {
    id: int("id").autoincrement().primaryKey(),
    phone: varchar("phone", { length: 20 }).notNull(),
    customerId: int("customer_id").references(() => users.id, { onDelete: "set null" }),
    name: varchar("name", { length: 191 }).notNull(),
    address: text("address"),
    status: mysqlEnum("status", ["open", "answered", "closed"]).notNull().default("open"),
    updatedAt: dt().notNull().default(sql`current_timestamp()`),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [index("threads_phone_idx").on(t.phone)],
);

export const helpdeskMessages = mysqlTable(
  "helpdesk_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    threadId: int("thread_id").notNull().references(() => helpdeskThreads.id, { onDelete: "cascade" }),
    sender: msgSenderEnum().notNull(),
    text: text("text").notNull(),
    auto: boolean("auto").notNull().default(false),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [index("messages_thread_idx").on(t.threadId)],
);

/** Knowledge base: auto-answers matched customer questions. */
export const helpdeskKb = mysqlTable("helpdesk_kb", {
  id: int("id").autoincrement().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  hits: int("hits").notNull().default(0),
  updatedAt: dt().notNull().default(sql`current_timestamp()`),
});


/** Web Push subscriptions (PC / Android / iOS-PWA browsers). */
export const pushSubscriptions = mysqlTable(
  "push_subscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: varchar("user_agent", { length: 255 }),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [index("push_user_idx").on(t.userId)],
);



/** LONGTEXT — base64 ইমেজ রাখার জন্য (TEXT ৬৪KB-এ সীমাবদ্ধ) */
const longtext = customType<{ data: string }>({ dataType: () => "longtext" });

/**
 * আপলোড করা ছবি ডাটাবেসে — সার্ভারলেস/রিড-অনলি ফাইলসিস্টেমেও কাজ করে।
 * (Vercel/Netlify-তে ডিস্কে লেখা যায় না, তাই ছবি এখানে জমা হয়)
 */
export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  mime: varchar("mime", { length: 100 }).notNull(),
  size: int("size").notNull().default(0),
  data: longtext("data").notNull(),
  createdAt: dt().notNull().default(sql`current_timestamp()`),
});


/**
 * প্রি-স্টক প্রোডাক্ট রিকোয়েস্ট — কাস্টমার এমন পণ্য চাইলে যা স্টকে/গোডাউনে/লিস্টিংয়ে নেই,
 * কর্মী সেটি এডমিনকে সাজেস্ট করে। এডমিন গ্রহণ করলে সরাসরি পণ্য তালিকায় যোগ করা যায়।
 */
export const productRequests = mysqlTable(
  "product_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: varchar("client_id", { length: 64 }).unique(),
    branchId: int("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    employeeId: int("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 191 }).notNull(),
    brand: varchar("brand", { length: 100 }),
    categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
    qty: int("qty").notNull().default(1),
    expectedPrice: int("expected_price").notNull().default(0),
    customerName: varchar("customer_name", { length: 191 }),
    customerPhone: varchar("customer_phone", { length: 20 }),
    note: text("note"),
    image: text("image"),
    status: requestStatusEnum().notNull().default("pending"),
    adminNote: text("admin_note"),
    productId: int("product_id").references(() => products.id, { onDelete: "set null" }),
    createdAt: dt().notNull().default(sql`current_timestamp()`),
  },
  (t) => [index("preq_branch_idx").on(t.branchId), index("preq_status_idx").on(t.status)],
);

export const branchesRelations = relations(branches, ({ many }) => ({
  products: many(products),
  users: many(users),
  serviceAreas: many(serviceAreas),
}));

export const productsRelations = relations(products, ({ one }) => ({
  branch: one(branches, { fields: [products.branchId], references: [branches.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  branch: one(branches, { fields: [orders.branchId], references: [branches.id] }),
  customer: one(users, { fields: [orders.customerId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export type Branch = typeof branches.$inferSelect;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ServiceArea = typeof serviceAreas.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type GodownSession = typeof godownSessions.$inferSelect;
export type GodownMovement = typeof godownMovements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type HelpdeskThread = typeof helpdeskThreads.$inferSelect;
export type HelpdeskMessage = typeof helpdeskMessages.$inferSelect;
export type HelpdeskKb = typeof helpdeskKb.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type Media = typeof media.$inferSelect;
export type ProductRequest = typeof productRequests.$inferSelect;
