import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 403 || res.status === 401) {
    const data = await res.json();
    if (data.error?.includes("horário")) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      toast.error("Sua sessão expirou, por favor, faca login novamente.");
      return Promise.reject(data);
    }
  }

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro na requisição');
  }

  return res.json();
}
