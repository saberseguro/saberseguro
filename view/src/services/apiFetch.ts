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
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
}
