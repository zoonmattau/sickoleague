"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

interface RuleAmendmentFormProps {
  userEmail?: string;
  userName?: string;
}

export function RuleAmendmentForm({ userEmail, userName }: RuleAmendmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Add timestamp
    formData.append("timestamp", new Date().toISOString());

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL || "",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        setSubmitStatus("success");
        form.reset();
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="coach_name" className="text-sm font-medium">
          Your Name / Discord Username
        </label>
        <input
          type="text"
          id="coach_name"
          name="coach_name"
          required
          defaultValue={userName || ""}
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
          placeholder="e.g., CoachMike#1234"
        />
      </div>

      {userEmail && (
        <input type="hidden" name="email" value={userEmail} />
      )}

      <div className="space-y-2">
        <label htmlFor="rule_section" className="text-sm font-medium">
          Related Section (if applicable)
        </label>
        <select
          id="rule_section"
          name="rule_section"
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
        >
          <option value="">Select a section...</option>
          <option value="Section 1: Gameplay & Season Structure">Section 1: Gameplay & Season Structure</option>
          <option value="Section 2: Teams & Rosters">Section 2: Teams & Rosters</option>
          <option value="Section 3: Scoring">Section 3: Scoring</option>
          <option value="Section 4: Home Field Advantage">Section 4: Home Field Advantage</option>
          <option value="Section 5: Salary Cap">Section 5: Salary Cap</option>
          <option value="Section 6: Contracts & Extensions">Section 6: Contracts & Extensions</option>
          <option value="Section 7: Draft & Rule 9">Section 7: Draft & Rule 9</option>
          <option value="Section 8: Free Agency">Section 8: Free Agency</option>
          <option value="Section 9: Trading">Section 9: Trading</option>
          <option value="Section 10: Coaching Staff">Section 10: Coaching Staff</option>
          <option value="New Section / General">New Section / General</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="proposal_title" className="text-sm font-medium">
          Proposal Title
        </label>
        <input
          type="text"
          id="proposal_title"
          name="proposal_title"
          required
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
          placeholder="e.g., Increase salary cap to 800 points"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="proposal_details" className="text-sm font-medium">
          Proposal Details
        </label>
        <textarea
          id="proposal_details"
          name="proposal_details"
          required
          rows={4}
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground resize-none"
          placeholder="Describe the proposed rule change and why you think it would improve the league..."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="rationale" className="text-sm font-medium">
          Rationale
        </label>
        <textarea
          id="rationale"
          name="rationale"
          rows={3}
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground resize-none"
          placeholder="Why should this change be adopted? What problem does it solve?"
        />
      </div>

      {submitStatus === "success" && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950 p-3 rounded-md">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Proposal submitted successfully!</span>
        </div>
      )}

      {submitStatus === "error" && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to submit. Please try again or contact an admin.</span>
        </div>
      )}

      <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
        <Send className="h-4 w-4" />
        {isSubmitting ? "Submitting..." : "Submit Proposal"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Proposals will be collected and put to a vote before the next season begins.
      </p>
    </form>
  );
}
