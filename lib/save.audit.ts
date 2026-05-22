import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AuditReport,
  AuditInput,
  generateAudit,
} from "@/lib/audit-engine";

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
        generateAudit(inp).recommendedMonthlyCost,
      ])
    ),

    userEmail: userEmail || null,
  });

  return doc.id;
}