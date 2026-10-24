import { ProductsListing, type ListingParams } from "@/components/store/listing";

export const dynamic = "force-dynamic";
export const metadata = { title: "সব পণ্য" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<ListingParams> }) {
  const params = await searchParams;
  return <ProductsListing params={params} />;
}
