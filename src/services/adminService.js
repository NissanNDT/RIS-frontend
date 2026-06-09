import api from "../api/axios";

// ──────────────────────────────────────────────
// ÁREAS
// ──────────────────────────────────────────────

export const getAreas = async () => {
  const res = await api.get("/get/areas");
  return res.data;
};

export const createArea = async (nombre) => {
  const res = await api.post("/areas", { area: nombre });
  return res.data;
};

export const updateArea = async (id, nombre) => {
  const res = await api.put(`/put/areas/${id}`, { area: nombre });
  return res.data;
};

export const deleteArea = async (id) => {
  const res = await api.delete(`/delete/areas/${id}`);
  return res.data;
};

// ──────────────────────────────────────────────
// PLANTAS
// ──────────────────────────────────────────────

export const getPlants = async () => {
  const res = await api.get("/get/plants");
  return res.data;
};

export const createPlant = async (nombre) => {
  const res = await api.post("/plants", { name: nombre });
  return res.data;
};

export const updatePlant = async (id, nombre) => {
  const res = await api.put(`/put/plants/${id}`, { name: nombre });
  return res.data;
};

export const deletePlant = async (id) => {
  const res = await api.delete(`/delete/plants/${id}`);
  return res.data;
};

// ──────────────────────────────────────────────
// USUARIOS
// ──────────────────────────────────────────────

export const getUsers = async () => {
  const res = await api.get("/get/users");
  return res.data;
};

export const createUser = async (payload) => {
  const res = await api.post("/users", payload);
  return res.data;
};

export const updateUser = async (id, payload) => {
  const res = await api.put(`/put/users/${id}`, payload);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/delete/users/${id}`);
  return res.data;
};

// ──────────────────────────────────────────────
// SV POR ÁREA
// ──────────────────────────────────────────────

export const getSvByArea = async () => {
  const res = await api.get("/get/sv-by-area");
  return res.data;
};

export const createSvByArea = async (payload) => {
  const res = await api.post("/sv-by-area", payload);
  return res.data;
};

export const updateSvByArea = async (id, payload) => {
  const res = await api.put(`/put/sv-by-area/${id}`, payload);
  return res.data;
};

export const deleteSvByArea = async (id) => {
  const res = await api.delete(`/delete/sv-by-area/${id}`);
  return res.data;
};

// ──────────────────────────────────────────────
// ROLES (solo lectura, para selects)
// ──────────────────────────────────────────────

export const getRoles = async () => {
  const res = await api.get("/get/roles");
  return res.data;
};
