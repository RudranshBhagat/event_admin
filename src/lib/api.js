const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || '';

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new ApiError(data?.message || 'Something went wrong. Please try again.', res.status, data);
  }

  return data;
}

function adminHeaders() {
  return { Authorization: `Bearer ${ADMIN_TOKEN}` };
}

// ── Public endpoints ─────────────────────────────────────────────────────────

export const registerOrder = (payload) =>
  request('/api/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const verifyPayment = (payload) =>
  request('/api/verify-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const submitUpiPayment = (payload) =>
  request('/api/submit-upi-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getOrderTickets = (orderId) => request(`/api/order/${orderId}/tickets`);

export const getDownloadUrl = (orderId) => `${API_URL}/api/order/${orderId}/download`;

export const recoverTicket = (email) =>
  request(`/api/recover-ticket?email=${encodeURIComponent(email)}`);

export const getTicket = (ticketId) => request(`/api/ticket/${ticketId}`);

// ── Admin endpoints ───────────────────────────────────────────────────────────

export const validateTicket = (ticketId, adminName) =>
  request('/api/validate-ticket', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ ticketId, adminName }),
  });

export const getAdminStats = () =>
  request('/api/admin/stats', { headers: adminHeaders() });

export const getAllTickets = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/admin/all-tickets${qs ? `?${qs}` : ''}`, { headers: adminHeaders() });
};

export const getPendingUpiOrders = () =>
  request('/api/admin/pending-upi', { headers: adminHeaders() });

export const approveUpiOrder = (orderId) =>
  request('/api/admin/approve-upi', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ orderId }),
  });

export const rejectUpiOrder = (orderId) =>
  request('/api/admin/reject-upi', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ orderId }),
  });

export { ApiError, API_URL };
