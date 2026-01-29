"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "COACH" | "PLAYER" | "STAFF" | "SYSTEM";
  content: string;
  emotion?: string | null;
  createdAt: Date | string;
}

interface MessageThreadProps {
  messages: Message[];
  isTyping?: boolean;
  targetName?: string;
}

export function MessageThread({
  messages,
  isTyping,
  targetName = "They",
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto max-h-[400px]">
      {messages.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">
          Start the conversation by making your pitch...
        </p>
      )}

      {messages.map((message) => {
        const isCoach = message.role === "COACH";
        const isSystem = message.role === "SYSTEM";

        if (isSystem) {
          return (
            <div
              key={message.id}
              className="text-center text-xs text-muted-foreground py-2 border-y border-dashed"
            >
              {message.content}
            </div>
          );
        }

        return (
          <div
            key={message.id}
            className={cn(
              "flex flex-col max-w-[80%] rounded-lg p-3 shadow-sm",
              isCoach
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-muted"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium opacity-70">
                {isCoach ? "You" : targetName}
              </span>
              {message.emotion && !isCoach && (
                <Badge variant="outline" className="text-xs py-0 px-1.5">
                  {message.emotion}
                </Badge>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <span className="text-xs opacity-50 mt-1 self-end">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      })}

      {isTyping && (
        <div className="self-start bg-muted rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium opacity-70 mr-2">{targetName}</span>
            <span className="animate-bounce">.</span>
            <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
              .
            </span>
            <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
              .
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
