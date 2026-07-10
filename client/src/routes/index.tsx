import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { PaperPlaneRight, Paperclip, CircleNotch } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { askQuestion, uploadFile } from "@/lib/api";
import type { QueryResponse } from "@/lib/api";
import { ChatMessage } from "@/components/chat-message";
import { motion } from "motion/react";

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
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-12 pt-24 pb-48 scroll-smooth">
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-white mb-6">
              ¿En qué te puedo ayudar?
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed max-w-[45ch]">
              Consulta tu base de conocimiento local. Subí documentos PDF, Markdown o TXT y analizalos con privacidad total.
            </p>
          </motion.div>
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col gap-10">
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
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-[#111] border border-white/5 rounded-2xl px-6 py-5 flex items-center gap-3">
                  <CircleNotch
                    size={16}
                    weight="bold"
                    className="animate-spin text-zinc-500"
                  />
                  <span className="text-[13px] font-medium text-zinc-400">Procesando...</span>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Floating Input bar */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent pt-32 pb-8 px-4 md:px-12 pointer-events-none">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-2 p-2 bg-[#111111]/80 backdrop-blur-2xl border border-white/5 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] pointer-events-auto transition-all focus-within:bg-[#151515] focus-within:border-white/10"
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
            className="shrink-0 p-3 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all duration-200 disabled:opacity-40"
            title="Adjuntar archivo"
          >
            <Paperclip size={20} weight="regular" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Preguntá lo que necesites..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-none px-2 py-4 text-[15px] text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors duration-200 disabled:opacity-40"
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-11 h-11 flex items-center justify-center mr-1 rounded-full bg-white text-black hover:bg-zinc-200 transition-all duration-300 disabled:opacity-20 disabled:bg-zinc-800 disabled:text-zinc-500 active:scale-95"
          >
            <PaperPlaneRight size={18} weight="fill" />
          </button>
        </form>
        <div className="text-center mt-4">
          <p className="text-[11px] font-mono tracking-wide text-zinc-600">
            RAG Engine uses local models. Responses are strictly private.
          </p>
        </div>
      </div>
    </div>
  );
}
