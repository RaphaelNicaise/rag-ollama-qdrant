import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { PaperPlaneRight, Paperclip, CircleNotch } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { askQuestion, uploadFile } from "@/lib/api";
import type { QueryResponse } from "@/lib/api";
import { ChatMessage } from "@/components/chat-message";

export const Route = createFileRoute("/")({
  component: ChatPage,
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timeTaken?: number | null;
  totalTokens?: number | null;
}

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const askMutation = useMutation({
    mutationFn: askQuestion,
    onSuccess: (data: QueryResponse) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          timeTaken: data.time_taken_seconds,
          totalTokens: data.total_tokens,
        },
      ]);
    },
    onError: (err: Error) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${err.message}`,
        },
      ]);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
        },
      ]);
    },
    onError: (err: Error) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error al subir archivo: ${err.message}`,
        },
      ]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || askMutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    setInput("");
    askMutation.mutate(trimmed);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: `Subiendo archivo: ${file.name}`,
      },
    ]);
    uploadMutation.mutate(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isLoading = askMutation.isPending || uploadMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-2">
              RAG Local
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md leading-relaxed">
              Subi un documento y hacele preguntas. Todo corre en tu
              maquina, sin enviar datos a la nube.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timeTaken={msg.timeTaken}
                totalTokens={msg.totalTokens}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-lg px-4 py-3">
                  <CircleNotch
                    size={18}
                    weight="bold"
                    className="animate-spin text-[var(--color-text-muted)]"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="shrink-0 p-2.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors duration-150 disabled:opacity-40"
            title="Subir archivo"
          >
            <Paperclip size={18} weight="bold" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribi tu pregunta..."
            disabled={isLoading}
            className="flex-1 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-md px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)] transition-colors duration-150 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="shrink-0 p-2.5 rounded-md bg-[var(--color-text-primary)] text-white hover:bg-[#333333] transition-colors duration-150 disabled:opacity-40 active:scale-[0.98]"
          >
            <PaperPlaneRight size={18} weight="bold" />
          </button>
        </form>
      </div>
    </div>
  );
}
