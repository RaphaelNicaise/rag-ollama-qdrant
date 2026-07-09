import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Trash,
  DownloadSimple,
  CircleNotch,
  HardDrive,
} from "@phosphor-icons/react";
import { fetchModels, deleteModel, pullModel } from "@/lib/api";
import type { PullProgress } from "@/lib/api";
import { ProgressBar } from "@/components/progress-bar";

export const Route = createFileRoute("/models")({
  component: ModelsPage,
});

function formatSize(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(0)} MB`;
}

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
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-1">
          Modelos
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          Gestion de modelos de Ollama instalados en tu maquina.
        </p>

        {/* Pull form */}
        <form
          onSubmit={handlePull}
          className="mb-8 p-4 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-lg"
        >
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Descargar modelo nuevo
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={pullName}
              onChange={(e) => setPullName(e.target.value)}
              placeholder="Nombre del modelo (ej: llama3:8b)"
              disabled={isPulling}
              className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)] transition-colors duration-150 disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!pullName.trim() || isPulling}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-md bg-[var(--color-text-primary)] text-white text-sm font-medium hover:bg-[#333333] transition-colors duration-150 disabled:opacity-40 active:scale-[0.98]"
            >
              {isPulling ? (
                <CircleNotch size={16} weight="bold" className="animate-spin" />
              ) : (
                <DownloadSimple size={16} weight="bold" />
              )}
              {isPulling ? "Descargando..." : "Descargar"}
            </button>
          </div>

          {isPulling && pullProgress && (
            <div className="mt-4">
              <ProgressBar
                value={pullProgress.completed ?? 0}
                max={pullProgress.total ?? 0}
                label={pullProgress.status}
              />
            </div>
          )}
        </form>

        {/* Models list */}
        {modelsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <CircleNotch
              size={24}
              weight="bold"
              className="animate-spin text-[var(--color-text-muted)]"
            />
          </div>
        ) : modelsQuery.isError ? (
          <div className="text-sm text-[var(--color-error)] bg-[var(--color-error-surface)] border border-[var(--color-error)]/20 rounded-lg px-4 py-3">
            No se pudieron cargar los modelos. Verifica que Ollama este
            corriendo.
          </div>
        ) : modelsQuery.data?.length === 0 ? (
          <div className="text-center py-12">
            <HardDrive
              size={40}
              weight="bold"
              className="mx-auto text-[var(--color-text-muted)] mb-3"
            />
            <p className="text-sm text-[var(--color-text-secondary)]">
              No hay modelos instalados. Descarga uno para empezar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {modelsQuery.data?.map((model) => (
              <div
                key={model.digest}
                className="flex items-center justify-between px-4 py-3 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors duration-150"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {model.name}
                  </p>
                  <p className="text-xs font-mono text-[var(--color-text-muted)] mt-0.5">
                    {formatSize(model.size)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Eliminar ${model.name}?`)) {
                      deleteMutation.mutate(model.name);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="shrink-0 p-2 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-surface)] transition-colors duration-150 disabled:opacity-40"
                  title="Eliminar modelo"
                >
                  <Trash size={16} weight="bold" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
