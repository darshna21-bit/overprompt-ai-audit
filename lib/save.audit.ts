import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AuditReport, AuditInput } from "@/lib/audit-engine";

export async function saveAuditToFirestore(
  inputs: AuditInput[],
  report: AuditReport
): Promise<string> {
  const doc = await addDoc(collection(db, "audits"), {
    inputs,
    results: report.results,
    totalMonthlySavings: report.totalMonthlySavings,
    totalAnnualSavings: report.totalAnnualSavings,
    createdAt: new Date(),
  });
  return doc.id; // this becomes the shareable ID
}