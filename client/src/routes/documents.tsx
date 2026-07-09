import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import {
  FilePdf,
  FileText,
  UploadSimple,
  CircleNotch,
  FileSearch,
} from "@phosphor-icons/react";
import { fetchDocuments, uploadFile } from "@/lib/api";

export const Route = createFileRoute("/documents")({
  component: DocumentsPage,
});

function fileIcon(filename: string) {
  if (filename.endsWith(".pdf")) return FilePdf;
  return FileText;
}

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-1">
              Documentos
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Archivos indexados en Qdrant para la busqueda semantica.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-[var(--color-text-primary)] text-white text-sm font-medium hover:bg-[#333333] transition-colors duration-150 disabled:opacity-40 active:scale-[0.98]"
            >
              {uploadMutation.isPending ? (
                <CircleNotch size={16} weight="bold" className="animate-spin" />
              ) : (
                <UploadSimple size={16} weight="bold" />
              )}
              Subir archivo
            </button>
          </div>
        </div>

        {/* Upload status */}
        {uploadMutation.isSuccess && (
          <div className="mb-4 text-sm text-[var(--color-success)] bg-[var(--color-success-surface)] border border-[var(--color-success)]/20 rounded-lg px-4 py-3">
            Archivo indexado correctamente.
          </div>
        )}
        {uploadMutation.isError && (
          <div className="mb-4 text-sm text-[var(--color-error)] bg-[var(--color-error-surface)] border border-[var(--color-error)]/20 rounded-lg px-4 py-3">
            Error al subir el archivo. Verifica el formato (PDF, TXT, MD).
          </div>
        )}

        {/* Documents list */}
        {docsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <CircleNotch
              size={24}
              weight="bold"
              className="animate-spin text-[var(--color-text-muted)]"
            />
          </div>
        ) : docsQuery.isError ? (
          <div className="text-sm text-[var(--color-error)] bg-[var(--color-error-surface)] border border-[var(--color-error)]/20 rounded-lg px-4 py-3">
            No se pudieron cargar los documentos.
          </div>
        ) : docsQuery.data?.length === 0 ? (
          <div className="text-center py-12">
            <FileSearch
              size={40}
              weight="bold"
              className="mx-auto text-[var(--color-text-muted)] mb-3"
            />
            <p className="text-sm text-[var(--color-text-secondary)]">
              No hay documentos indexados. Subi un PDF, TXT o MD para
              empezar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {docsQuery.data?.map((doc, i) => {
              const Icon = fileIcon(doc.filename);
              return (
                <div
                  key={`${doc.filename}-${i}`}
                  className="flex items-center gap-3 px-4 py-3 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-lg"
                >
                  <Icon
                    size={20}
                    weight="bold"
                    className="shrink-0 text-[var(--color-text-secondary)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {doc.filename}
                    </p>
                    {doc.indexed_at && (
                      <p className="text-xs font-mono text-[var(--color-text-muted)] mt-0.5">
                        {doc.indexed_at}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
