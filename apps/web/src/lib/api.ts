// src/services/api.ts

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let detailMsg = '';
    if (data?.details && typeof data.details === 'object') {
      detailMsg = Object.entries(data.details)
        .map(([field, msgs]) => `${field.replace('_', ' ')}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join('; ');
    }

    throw new Error(
      detailMsg ||
      (data?.message && data?.message !== 'Validation failed' ? data.message : null) ||
      data?.error ||
      data?.message ||
      `Request failed with status ${response.status}.`
    );
  }

  return data as T;
}

/* ===========================================================
   Token Refresh
=========================================================== */

export async function refreshToken(): Promise<{ access_token: string; refresh_token?: string } | null> {
  const refreshTokenValue = localStorage.getItem('refresh_token');
  if (!refreshTokenValue) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshTokenValue }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const newAccessToken = data?.data?.access_token || data?.access_token;
    if (newAccessToken) {
      localStorage.setItem('access_token', newAccessToken);
      const newRefreshToken = data?.data?.refresh_token || data?.refresh_token;
      if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/* ===========================================================
   Generic Request
=========================================================== */

export async function request<T>(
  path: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const { timeout: timeoutMs = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(fetchOptions.headers);

  if (
    fetchOptions.body &&
    !(fetchOptions.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  const token = getToken();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  try {
    let response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      }
    );

    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        const newToken = localStorage.getItem('access_token');
        headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(
          `${API_BASE_URL}${path}`,
          {
            ...fetchOptions,
            headers,
            signal: controller.signal,
          }
        );
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_user');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    clearTimeout(timeoutId);
    return handleResponse<T>(response);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/* ===========================================================
   Download
=========================================================== */

export async function download(
  path: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Blob> {
  const { timeout: timeoutMs = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(fetchOptions.headers);

  const token = getToken();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        "Download failed."
      );
    }

    return response.blob();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Download timed out');
    }
    throw error;
  }
}

/* ===========================================================
   Authentication
=========================================================== */

export const authApi = {
  login(payload: {
    identifier: string;
    password: string;
  }) {
    return request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  exchangeGoogleCode(code: string) {
    return request("/api/v1/auth/google/exchange", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  forgotPassword(payload: { email: string }) {
    return request("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  resetPassword(payload: { token: string; password: string }) {
    return request("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  register(payload: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) {
    return request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

/* ===========================================================
   Dashboard
=========================================================== */

export const dashboardApi = {
  summary() {
    return request("/api/v1/dashboard/summary");
  },
};

/* ===========================================================
   Warehouses
=========================================================== */

export const warehouseApi = {
  list(params?: Record<string, string>) {
    const query = new URLSearchParams(
      params || {}
    ).toString();

    return request(
      `/api/v1/warehouses${
        query ? `?${query}` : ""
      }`
    );
  },

  get(id: number) {
    return request(
      `/api/v1/warehouses/${id}`
    );
  },

  create(payload: unknown) {
    return request(
      "/api/v1/warehouses",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  update(
    id: number,
    payload: unknown
  ) {
    return request(
      `/api/v1/warehouses/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
  },

  delete(id: number, params?: Record<string, string>) {
    const query = new URLSearchParams(params || {}).toString();
    return request(
      `/api/v1/warehouses/${id}${query ? `?${query}` : ''}`,
      {
        method: "DELETE",
      }
    );
  },
};

/* ===========================================================
   Products
=========================================================== */

export const productApi = {
  list(params?: Record<string, string>) {
    const query = new URLSearchParams(
      params || {}
    ).toString();

    return request(
      `/api/v1/warehouses/products${
        query ? `?${query}` : ""
      }`
    );
  },

  get(id: number) {
    return request(
      `/api/v1/warehouses/products/${id}`
    );
  },

  create(payload: unknown) {
    return request(
      "/api/v1/warehouses/products",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  update(
    id: number,
    payload: unknown
  ) {
    return request(
      `/api/v1/warehouses/products/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
  },

  delete(id: number) {
    return request(
      `/api/v1/warehouses/products/${id}`,
      {
        method: "DELETE",
      }
    );
  },
};

/* ===========================================================
   Orders
=========================================================== */

export const orderApi = {
  list(params?: Record<string, string>) {
    const query = new URLSearchParams(
      params || {}
    ).toString();

    return request(
      `/api/v1/orders${
        query ? `?${query}` : ""
      }`
    );
  },

  get(id: number) {
    return request(
      `/api/v1/orders/${id}`
    );
  },

  create(payload: unknown) {
    return request(
      "/api/v1/orders",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  update(
    id: number,
    payload: unknown
  ) {
    return request(
      `/api/v1/orders/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
  },

  delete(id: number) {
    return request(
      `/api/v1/orders/${id}`,
      {
        method: "DELETE",
      }
    );
  },
};

/* ===========================================================
   Notifications
=========================================================== */

export const notificationApi = {
  getPreferences() {
    return request("/api/v1/notifications/preferences");
  },
  savePreferences(payload: Record<string, boolean>) {
    return request("/api/v1/notifications/preferences", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  testEmail(payload: {
    email: string;
    preferences: Record<string, boolean>;
  }) {
    return request("/api/v1/notifications/test-email", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  list(params?: Record<string, string>) {
    const query = new URLSearchParams(params || {}).toString();
    return request(`/api/v1/notifications${query ? `?${query}` : ''}`);
  },
  unreadCount() {
    return request('/api/v1/notifications/unread-count');
  },
  markRead(id: number) {
    return request(`/api/v1/notifications/${id}/read`, { method: 'POST' });
  },
  markAllRead() {
    return request('/api/v1/notifications/mark-all-read', { method: 'POST' });
  },
  delete(id: number) {
    return request(`/api/v1/notifications/${id}`, { method: 'DELETE' });
  },
};

/* ===========================================================
   AI & Machine Learning APIs
=========================================================== */

export const aiApi = {
  forecast(params?: Record<string, any>) {
    const cleaned: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== '') cleaned[k] = String(v);
      });
    }
    const query = new URLSearchParams(cleaned).toString();
    return request(`/api/v1/ai/forecast${query ? `?${query}` : ''}`);
  },
  rebalance() {
    return request('/api/v1/ai/rebalance');
  },
  festivalDemand(params?: Record<string, any>) {
    const cleaned: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== '') cleaned[k] = String(v);
      });
    }
    const query = new URLSearchParams(cleaned).toString();
    return request(`/api/v1/ai/festival-demand${query ? `?${query}` : ''}`);
  },
  copilotChat(prompt: string) {
    return request('/api/v1/ai/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },
  listMcpTools() {
    return request('/api/v1/ai/mcp/tools');
  },
};

