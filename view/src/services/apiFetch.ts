import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

type ApiFetchOptions = RequestInit & {
  responseType?: "json" | "blob";
};

export type ApiBlobResponse = {
  data: Blob;
  headers: Record<string, string>;
};

export function apiFetch<T>(
  url: string,
  options?: ApiFetchOptions & { responseType?: "json" }
): Promise<T>;

export function apiFetch(
  url: string,
  options: ApiFetchOptions & { responseType: "blob" }
): Promise<ApiBlobResponse>;

export async function apiFetch<T = any>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T | ApiBlobResponse> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (options.responseType === "blob") {
    if (res.status === 403 || res.status === 401) {
      try {
        const errorData = await res.json();

        if (errorData.error?.includes("horário")) {
          localStorage.removeItem("token");
          toast.error("Sua sessão expirou, por favor, faça login novamente.");
          window.location.replace("/login");
          return Promise.reject(errorData);
        }

        throw new Error(errorData.error || "Erro na requisição");
      } catch (err) {
        throw err instanceof Error ? err : new Error("Erro na requisição");
      }
    }

    if (!res.ok) {
      try {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro na requisição");
      } catch {
        throw new Error("Erro na requisição");
      }
    }

    const blob = await res.blob();

    return {
      data: blob,
      headers: {
        "content-type": res.headers.get("content-type") || "",
        "content-disposition": res.headers.get("content-disposition") || "",
      },
    };
  }

  const data = await res.json();

  if (res.status === 403 || res.status === 401) {
    if (data.error?.includes("horário")) {
      localStorage.removeItem("token");
      toast.error("Sua sessão expirou, por favor, faca login novamente.");
      window.location.replace("/login");
      return Promise.reject(data);
    }
  }

  if (!res.ok) {
    console.log(data);
    throw new Error(data.error || "Erro na requisição");
  }

  return data;
}