const configuredBackendUrl =
  import.meta.env.VITE_FLOATE_BACKEND_URL ||
  import.meta.env.NEXT_PUBLIC_FLOATE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "";

export const FLOATE_BACKEND_URL = configuredBackendUrl.trim().replace(/\/+$/, "");
