"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, AlertCircle } from "lucide-react";

interface RebuttalFormProps {
  onSubmit: (text: string) => Promise<void>;
  disabled?: boolean;
  existingRebuttal?: string | null;
}

export function RebuttalForm({
  onSubmit,
  disabled,
  existingRebuttal,
}: RebuttalFormProps) {
  const [text, setText] = useState(existingRebuttal || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterCount = text.length;
  const minChars = 50;
  const maxChars = 2000;
  const isValid = characterCount >= minChars && characterCount <= maxChars;

  const handleSubmit = async () => {
    if (!isValid || disabled) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingRebuttal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Response</CardTitle>
          <CardDescription>
            You have already submitted your response
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <p className="whitespace-pre-wrap text-sm">{existingRebuttal}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Response</CardTitle>
        <CardDescription>
          Address the board&apos;s concerns and make your case
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Write your response to the board. Explain your strategy, address their concerns, and outline your vision for the club..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || isSubmitting}
          className="min-h-[200px] resize-none"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {characterCount < minChars ? (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">
                  {minChars - characterCount} more characters needed
                </span>
              </>
            ) : characterCount > maxChars ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-500">
                  {characterCount - maxChars} characters over limit
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {characterCount} / {maxChars} characters
              </span>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValid || disabled || isSubmitting}
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Response
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Tips for a strong response:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Acknowledge the board&apos;s points directly</li>
            <li>Provide context for results (injuries, new players, etc.)</li>
            <li>Show accountability where appropriate</li>
            <li>Outline a clear path forward</li>
            <li>Maintain a professional, respectful tone</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
