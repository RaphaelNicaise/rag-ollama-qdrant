import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[75%] px-6 py-5 text-[15px] leading-[1.7]",
          isUser
            ? "bg-[#1A1A1A] text-zinc-100 rounded-[20px] rounded-tr-[4px] border border-white/[0.04]"
            : "text-zinc-300"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-zinc-500">
              RAG Engine
            </span>
          </div>
        )}
        
        {isUser ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#0A0A0A] prose-pre:border prose-pre:border-[#222] prose-pre:p-4 prose-code:font-mono prose-code:text-[13px] max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}

        {!isUser && (timeTaken != null || totalTokens != null) && (
          <div className="mt-4 pt-4 border-t border-[#222] flex gap-4 text-[11px] font-mono text-zinc-500">
            {timeTaken != null && <span>{timeTaken}s</span>}
            {totalTokens != null && <span>{totalTokens} tokens</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
