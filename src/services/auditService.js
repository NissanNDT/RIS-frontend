import api from "../api/axios";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  },
});

// GET all audits
export const getAllAudits = async () => {
  const res = await api.get("/get/audits", authHeaders());
  return res.data;
};

// GET audit by id
export const getAuditById = async (id) => {
  const res = await api.get(`/audits/${id}`, authHeaders());
  return res.data;
};

// GET audits by user
export const getAuditsByUser = async (idUser) => {
  const res = await api.get(`/audits/user/${idUser}`, authHeaders());
  return res.data;
};

// POST create audit
export const createAudit = async (auditData) => {
  const res = await api.post("/audits", auditData, authHeaders());
  return res.data;
};

// PUT update audit
export const updateAudit = async (id, fields) => {
  const config = { ...authHeaders() };
  const res = await api.put(`/put/audits/${id}`, fields, config);
  return res.data;
};

// DELETE audit
export const deleteAudit = async (id) => {
  const res = await api.delete(`/delete/audits/${id}`, authHeaders());
  return res.data;
};

// GET findings by audit id
export const getFindingsByAudit = async (auditId) => {
  const res = await api.get("/get/findings", authHeaders());
  // Since there is no specific backend route for findings by audit, we filter them manually
  // Or I could add a route in the backend. Let's see if there is a better way.
  const allFindings = res.data;
  return allFindings.filter(f => f.id_audit === Number(auditId));
};
