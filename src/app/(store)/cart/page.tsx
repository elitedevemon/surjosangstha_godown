import { CartCheckout } from "@/components/store/cart-checkout";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "কার্ট ও চেকআউট" };

export default async function CartPage() {
  const user = await getCurrentUser();
  return <CartCheckout user={user} />;
}
