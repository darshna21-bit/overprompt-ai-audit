import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AuditReport, AuditInput, PLAN_PRICES } from "@/lib/audit-engine";

export async function saveAuditToFirestore(
  inputs: AuditInput[],
  report: AuditReport,
  userEmail?: string
): Promise<string> {

  const doc = await addDoc(collection(db, "audits"), {
    inputs,
    results: report.results,
    totalMonthlySavings: report.totalMonthlySavings,
    totalAnnualSavings: report.totalAnnualSavings,
    createdAt: new Date(),

    pricingSnapshot: Object.fromEntries(
      inputs.map((inp) => [
        inp.tool,
        PLAN_PRICES[inp.tool]?.[inp.plan] ?? 0,  // ← current plan's canonical price
      ])
    ),

    userEmail: userEmail || null,
  });

  return doc.id;
}