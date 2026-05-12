import api from "../api/axios";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

const authHeadersJSON = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  },
});

// POST create incident (multipart – supports file upload)
export const createIncident = async (formData) => {
  const res = await api.post("/incidents", formData, authHeaders());
  return res.data;
};

// GET all incidents
export const getAllIncidents = async () => {
  const res = await api.get("/get/incidents", authHeadersJSON());
  return res.data;
};

// GET incident by id
export const getIncidentById = async (id) => {
  const res = await api.get(`/incidents/${id}`, authHeadersJSON());
  return res.data;
};

// PUT update incident
export const updateIncident = async (id, fields) => {
  const res = await api.put(`/put/incidents/${id}`, fields, authHeadersJSON());
  return res.data;
};

// DELETE incident
export const deleteIncident = async (id) => {
  const res = await api.delete(`/delete/incidents/${id}`, authHeadersJSON());
  return res.data;
};
