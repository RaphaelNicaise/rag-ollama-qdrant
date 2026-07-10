import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import {
  FilePdf,
  FileText,
  UploadSimple,
  CircleNotch,
  MagnifyingGlass,
  Trash,
} from "@phosphor-icons/react";
import { fetchDocuments, uploadFile, deleteDocument } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import type { Variants } from "motion/react";

export const Route = createFileRoute("/documents")({
  component: DocumentsPage,
});

function fileIcon(filename: string) {
  if (filename.endsWith(".pdf")) return FilePdf;
  return FileText;
}

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

function DocumentsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    uploadMutation.mutate(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="h-full overflow-y-auto px-4 md:px-12 py-24 scroll-smooth">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-16"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tighter text-white mb-4">
              Knowledge Base
            </h1>
            <p className="text-base text-zinc-400 max-w-[45ch]">
              Archivos indexados en Qdrant. Todo lo que subas acá será utilizado como contexto por el LLM.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-black text-[15px] font-medium hover:bg-zinc-200 transition-all duration-300 disabled:opacity-20 disabled:bg-zinc-800 disabled:text-zinc-500 active:scale-95"
            >
              {uploadMutation.isPending ? (
                <CircleNotch size={18} weight="bold" className="animate-spin" />
              ) : (
                <UploadSimple size={18} weight="bold" />
              )}
              {uploadMutation.isPending ? "Subiendo..." : "Upload Document"}
            </button>
          </div>
        </motion.div>

        {/* Upload status */}
        <AnimatePresence>
          {uploadMutation.isSuccess && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="text-[13px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Archivo indexado correctamente.
              </div>
            </motion.div>
          )}
          {uploadMutation.isError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="text-[13px] text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-5 py-4 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Error al subir el archivo. Verifica el formato (PDF, TXT, MD).
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Documents list */}
        <div className="space-y-6">
          <h2 className="text-[13px] font-medium text-zinc-400 uppercase tracking-widest">
            Indexed Files
          </h2>

          {docsQuery.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <CircleNotch
                size={24}
                weight="bold"
                className="animate-spin text-zinc-600"
              />
            </div>
          ) : docsQuery.isError ? (
            <div className="text-sm text-red-400 bg-red-950/20 border border-red-900/50 rounded-xl px-5 py-4">
              Error cargando documentos. Revisa la conexión con Qdrant.
            </div>
          ) : docsQuery.data?.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-[#222] rounded-[24px]">
              <MagnifyingGlass
                size={32}
                weight="duotone"
                className="mx-auto text-zinc-600 mb-4"
              />
              <p className="text-[15px] text-zinc-500">
                No hay documentos en la base de datos.
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 grid-flow-dense"
            >
              {docsQuery.data?.map((doc, i) => {
                const Icon = fileIcon(doc.filename);
                return (
                  <motion.div
                    variants={itemVariants}
                    key={`${doc.filename}-${i}`}
                    className="group relative flex items-center gap-5 p-6 bg-[#111111] border border-[#222222] rounded-[20px] hover:border-zinc-700 transition-colors duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] border border-[#222] flex items-center justify-center shrink-0">
                      <Icon
                        size={24}
                        weight="duotone"
                        className="text-zinc-400 group-hover:text-white transition-colors"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-zinc-100 truncate mb-1">
                        {doc.filename}
                      </p>
                      {doc.indexed_at && (
                        <p className="text-[11px] font-mono tracking-widest uppercase text-zinc-500">
                          {doc.indexed_at}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar definitivamente el documento ${doc.filename}?`)) {
                          deleteMutation.mutate(doc.filename);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="shrink-0 p-2.5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-950/30 transition-all duration-200 disabled:opacity-40 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Eliminar documento"
                    >
                      <Trash size={16} weight="fill" />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
