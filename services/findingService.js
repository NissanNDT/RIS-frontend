import api from "../api/axios";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  },
});

// GET all findings
export const getAllFindings = async () => {
  const res = await api.get("/get/findings", authHeaders());
  return res.data;
};

// GET finding by id
export const getFindingById = async (id) => {
  const res = await api.get(`/findings/${id}`, authHeaders());
  return res.data;
};

// POST create finding
export const createFinding = async (findingData) => {
  const res = await api.post("/findings", findingData, authHeaders());
  return res.data;
};

// PUT update finding
export const updateFinding = async (id, fields) => {
  const res = await api.put(`/put/findings/${id}`, fields, authHeaders());
  return res.data;
};

// DELETE finding
export const deleteFinding = async (id) => {
  const res = await api.delete(`/delete/findings/${id}`, authHeaders());
  return res.data;
};