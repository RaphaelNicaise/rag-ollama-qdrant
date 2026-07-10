const API_BASE = "/api";

export interface QueryResponse {
  answer: string;
  time_taken_seconds: number | null;
  total_tokens: number | null;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface DocumentInfo {
  filename: string;
  indexed_at: string | null;
}

export interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export async function askQuestion(input: string): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error((await res.json()).detail ?? "Error del servidor");
  return res.json();
}

export async function uploadFile(files: FileList | File[]): Promise<{ status: string; message: string }> {
  const form = new FormData();
  Array.from(files).forEach((file) => {
    form.append("files", file);
  });
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error((await res.json()).detail ?? "Error al subir archivos");
  return res.json();
}

export async function fetchModels(): Promise<OllamaModel[]> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error("No se pudieron obtener los modelos");
  const data = await res.json();
  return data.models ?? [];
}

export async function deleteModel(name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/models/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar el modelo");
}

export async function pullModel(
  name: string,
  onProgress: (p: PullProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}/models/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    signal,
  });
  if (!res.ok) throw new Error("No se pudo iniciar la descarga");
  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) {
        try {
          onProgress(JSON.parse(line));
        } catch {
          // skip malformed JSON lines
        }
      }
    }
  }
}

export async function fetchDocuments(): Promise<DocumentInfo[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error("No se pudieron obtener los documentos");
  return res.json();
}

export async function deleteDocument(filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar el documento");
}
