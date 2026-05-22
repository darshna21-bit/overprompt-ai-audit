"use client";

import { useState } from "react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = {
  tool: string;
  plan: string;
  monthlySavings: number;
  annualSavings: number;
  auditId: string;
};

export default function LeadCaptureForm({
  tool,
  plan,
  monthlySavings,
  annualSavings,
  auditId,
}: Props) {
  const [email, setEmail]       = useState("");
  const [company, setCompany]   = useState("");
  const [role, setRole]         = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState("");

  const highSavings = monthlySavings >= 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (honeypot) return;

    if (!email) {
      setError("Email is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      await addDoc(collection(db, "leads"), {
        email,
        company:       company || null,
        role:          role || null,
        tool,
        plan,
        monthlySavings,
        annualSavings,
        auditId:       auditId || null,
        highSavings,
        createdAt:     new Date(),
        source:        "audit-form",
      });

      // Round 2: write userEmail back to the audit doc so detect-changes can email this user
      if (auditId) {
        await updateDoc(doc(db, "audits", auditId), {
          userEmail: email,
        });
      }

      await fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tool,
          monthlySavings,
          annualSavings,
          auditId,
        }),
      });

      setSuccess(true);

    } catch (err) {
      console.error("[LeadCaptureForm] Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/10 p-6">
        <h4 className="text-2xl font-semibold text-white">
          ✓ Report sent to your inbox
        </h4>
        <p className="mt-3 text-gray-300">
          Check your email for a copy of this audit.
          {highSavings && (
            <span className="font-medium text-green-400">
              {" "}Given your ${monthlySavings}/mo savings opportunity,
              a Credex advisor will follow up with next steps.
            </span>
          )}
        </p>
        {highSavings && (
          <a
            href="https://credex.rocks"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-xl bg-green-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-green-400"
          >
            Book a Credex consultation →
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4">
        <h3 className="text-2xl font-semibold text-white">
          {highSavings
            ? `Get your $${annualSavings.toLocaleString()}/yr savings plan`
            : "Send this report to your inbox"}
        </h3>
        <p className="mt-2 text-gray-400">
          {highSavings
            ? "Your audit shows significant savings potential. Enter your email and a Credex advisor will reach out with next steps."
            : "Enter your email to receive a copy of this audit. We'll notify you when new optimizations apply to your stack."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <input
          type="email"
          placeholder="Work email *"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-white/30"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-white/30"
          />
          <input
            type="text"
            placeholder="Your role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-white/30"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : highSavings
            ? "Get my savings plan →"
            : "Send report to inbox"}
        </button>

        <p className="text-center text-xs text-gray-500">
          No spam. Your audit data is never sold or shared.
        </p>
      </form>
    </div>
  );
}