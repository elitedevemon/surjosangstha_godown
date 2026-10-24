import { db } from "@/db";
import { branches, serviceAreas } from "@/db/schema";
import { eq } from "drizzle-orm";
import BranchesPage from "./BranchesClient";
import { getSettings } from "@/actions/extra";

export const dynamic = "force-dynamic";
export const metadata = { title: "আমাদের শাখা ও সার্ভিস এলাকা" };

export default async function BranchesServer() {
  const [branchList, areaList] = await Promise.all([
    db.select().from(branches).orderBy(branches.id),
    db.select().from(serviceAreas).orderBy(serviceAreas.district, serviceAreas.upazila),
  ]);
  const st = await getSettings();
  return <BranchesPage branches={branchList} areas={areaList} feeIn={st.deliveryFeeIn} feeOut={st.deliveryFeeOut} />;
}
