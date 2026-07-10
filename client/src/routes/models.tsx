import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Trash,
  DownloadSimple,
  CircleNotch,
  HardDrive,
  Cpu,
} from "@phosphor-icons/react";
import { fetchModels, deleteModel, pullModel } from "@/lib/api";
import type { PullProgress } from "@/lib/api";
import { ProgressBar } from "@/components/progress-bar";
import { motion, AnimatePresence } from "motion/react";
import type { Variants } from "motion/react";

export const Route = createFileRoute("/models")({
  component: ModelsPage,
});

function formatSize(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(0)} MB`;
}

// Framer motion variants for stagger
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
};

function ModelsPage() {
  const queryClient = useQueryClient();
  const [pullName, setPullName] = useState("");
  const [pullProgress, setPullProgress] = useState<PullProgress | null>(null);
  const [isPulling, setIsPulling] = useState(false);

  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteModel,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = pullName.trim();
    if (!name || isPulling) return;

    setIsPulling(true);
    setPullProgress(null);

    try {
      await pullModel(name, (p) => setPullProgress(p));
      void queryClient.invalidateQueries({ queryKey: ["models"] });
      setPullName("");
    } catch {
      // handled by UI state
    } finally {
      setIsPulling(false);
      setPullProgress(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 md:px-12 py-24 scroll-smooth">
      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-medium tracking-tighter text-white mb-4">
            Language Models
          </h1>
          <p className="text-base text-zinc-400 max-w-[45ch]">
            Gestioná y descargá modelos de inteligencia artificial locales. El procesamiento ocurre offline en tu máquina.
          </p>
        </motion.div>

        {/* Pull form (Asymmetric Bento style) */}
        <motion.form
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          onSubmit={handlePull}
          className="mb-16 p-8 bg-[#111111] border border-[#222222] rounded-[24px] relative overflow-hidden group"
        >
          <div className="flex flex-col md:flex-row gap-6 items-end relative z-10">
            <div className="flex-1 w-full">
              <label className="block text-[13px] font-medium text-zinc-400 mb-3 uppercase tracking-widest">
                Download Model
              </label>
              <input
                type="text"
                value={pullName}
                onChange={(e) => setPullName(e.target.value)}
                placeholder="e.g. llama3:8b, mistral..."
                disabled={isPulling}
                className="w-full bg-[#0A0A0A] border border-[#222222] rounded-2xl px-5 py-4 text-[15px] text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors duration-300 disabled:opacity-40"
              />
            </div>
            <button
              type="submit"
              disabled={!pullName.trim() || isPulling}
              className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-black text-[15px] font-medium hover:bg-zinc-200 transition-all duration-300 disabled:opacity-20 disabled:bg-zinc-800 disabled:text-zinc-500 active:scale-95"
            >
              {isPulling ? (
                <CircleNotch size={18} weight="bold" className="animate-spin" />
              ) : (
                <DownloadSimple size={18} weight="bold" />
              )}
              {isPulling ? "Downloading..." : "Download"}
            </button>
          </div>

          <AnimatePresence>
            {isPulling && pullProgress && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
              >
                <ProgressBar
                  value={pullProgress.completed ?? 0}
                  max={pullProgress.total ?? 0}
                  label={pullProgress.status}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        {/* Models list / Grid */}
        <div className="space-y-6">
          <h2 className="text-[13px] font-medium text-zinc-400 uppercase tracking-widest">
            Installed Models
          </h2>

          {modelsQuery.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <CircleNotch
                size={24}
                weight="bold"
                className="animate-spin text-zinc-600"
              />
            </div>
          ) : modelsQuery.isError ? (
            <div className="text-sm text-red-400 bg-red-950/20 border border-red-900/50 rounded-xl px-5 py-4">
              Error cargando modelos. Asegurate de que Ollama esté corriendo en el puerto 11434.
            </div>
          ) : modelsQuery.data?.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-[#222] rounded-[24px]">
              <HardDrive
                size={32}
                weight="duotone"
                className="mx-auto text-zinc-600 mb-4"
              />
              <p className="text-[15px] text-zinc-500">
                No hay modelos instalados.
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 grid-flow-dense"
            >
              {modelsQuery.data?.map((model) => (
                <motion.div
                  variants={itemVariants}
                  key={model.digest}
                  className="group relative flex flex-col p-6 bg-[#111111] border border-[#222222] rounded-[20px] hover:border-zinc-700 transition-colors duration-300 overflow-hidden"
                >
                  <div className="flex-1 min-w-0 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 shrink-0">
                      <Cpu size={20} weight="duotone" className="text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-lg font-medium text-zinc-100 truncate">
                      {model.name}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-[12px] font-mono text-zinc-500 uppercase tracking-widest bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                      {formatSize(model.size)}
                    </p>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar definitivamente el modelo ${model.name}?`)) {
                          deleteMutation.mutate(model.name);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="shrink-0 p-2.5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-950/30 transition-all duration-200 disabled:opacity-40"
                      title="Eliminar modelo"
                    >
                      <Trash size={16} weight="fill" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
