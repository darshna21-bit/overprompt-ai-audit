"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = {
  tool: string;
  plan: string;
  annualSavings: number;
};

export default function LeadCaptureForm({
  tool,
  plan,
  annualSavings,
}: Props) {

  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    try {

      setIsSubmitting(true);

      await addDoc(
        collection(db, "leads"),
        {
          email,
          company,
          role,
          tool,
          plan,
          annualSavings,
          createdAt: new Date(),
        }
      );

      setSuccess(true);

      setEmail("");
      setCompany("");
      setRole("");

    } catch (error) {

      console.error(error);

    } finally {

      setIsSubmitting(false);

    }
  };

  if (success) {
    return (

      <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/10 p-6">

        <h4 className="text-2xl font-semibold text-white">
          Report Saved Successfully
        </h4>

        <p className="mt-3 text-gray-300">
          Your audit insights have been securely saved.
        </p>

      </div>
    );
  }

  return (

    <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

      <div className="mb-6">

        <h3 className="text-2xl font-semibold text-white">
          Save Full Audit Report
        </h3>

        <p className="mt-2 text-gray-400">
          Enter your details to store this AI optimization audit.
        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <input
          type="email"
          placeholder="Work Email"
          required
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
        />

        <input
          type="text"
          placeholder="Company Name"
          value={company}
          onChange={(e) =>
            setCompany(e.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
        />

        <input
          type="text"
          placeholder="Your Role"
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:opacity-90"
        >
          {isSubmitting
            ? "Saving Report..."
            : "Save Audit Report"}
        </button>

      </form>

    </div>
  );
}