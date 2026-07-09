interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timeTaken?: number | null;
  totalTokens?: number | null;
}

export function ChatMessage({
  role,
  content,
  timeTaken,
  totalTokens,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[var(--color-text-primary)] text-white"
            : "bg-[var(--color-canvas)] text-[var(--color-text-primary)] border border-[var(--color-border)]"
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>

        {!isUser && (timeTaken != null || totalTokens != null) && (
          <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex gap-4 text-xs font-mono text-[var(--color-text-muted)]">
            {timeTaken != null && <span>{timeTaken}s</span>}
            {totalTokens != null && <span>{totalTokens} tokens</span>}
          </div>
        )}
      </div>
    </div>
  );
}
