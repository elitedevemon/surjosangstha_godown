import { ProductsListing, type ListingParams } from "@/components/store/listing";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<ListingParams> }) {
  const { slug } = await params;
  const sp = await searchParams;
  return <ProductsListing params={{ ...sp, category: slug }} />;
}
