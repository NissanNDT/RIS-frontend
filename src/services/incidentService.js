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

export const createIncident = async (data) => {
  return api.post("/incidents", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
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

// POST create incident format (Datos Generales)
export const createIncidentFormat = async (data) => {
  const res = await api.post("/", data, authHeadersJSON());
  return res.data;
};

// GET incident format by incident id
export const getIncidentFormatByIncident = async (id_incident) => {
  const res = await api.get(`/${id_incident}`, authHeadersJSON());
  return res.data;
};

// PUT update incident format
export const updateIncidentFormat = async (id_incident, fields) => {
  const res = await api.put(`/put/${id_incident}`, fields, authHeadersJSON());
  return res.data;
};

// GET factor tree records by id_incident_format (usa endpoint de factorTreeRoutes)
export const getFactorTreeByIncidentFormat = async (id_incident_format) => {
  const res = await api.get(
    `/factor-tree/incident-format/${id_incident_format}`,
    authHeadersJSON()
  );
  return res.data;
};

// POST create a single factor tree record
export const createFactorTree = async (data) => {
  const res = await api.post("/factor-tree", data, authHeadersJSON());
  return res.data;
};

// PUT update a single factor tree record
export const updateFactorTree = async (id, fields) => {
  const res = await api.put(`/put/factor-tree/${id}`, fields, authHeadersJSON());
  return res.data;
};

// GET intervening factors by id_incident_format
export const getInterveningFactorsByIncidentFormat = async (id_incident_format) => {
  const res = await api.get(`/intervening-factors/incident-format/${id_incident_format}`, authHeadersJSON());
  return res.data;
};

// POST create intervening factor
export const createInterveningFactor = async (data) => {
  const res = await api.post("/intervening-factors", data, authHeadersJSON());
  return res.data;
};

// PUT update intervening factor
export const updateInterveningFactor = async (id, fields) => {
  const res = await api.put(`/put/intervening-factors/${id}`, fields, authHeadersJSON());
  return res.data;
};

// GET hazard background by id_incident_format
export const getHazardBackgroundByIncidentFormat = async (id_incident_format) => {
  const res = await api.get(`/hazard-background/incident-format/${id_incident_format}`, authHeadersJSON());
  return res.data;
};

// POST create hazard background
export const createHazardBackground = async (data) => {
  const res = await api.post("/hazard-background", data, authHeadersJSON());
  return res.data;
};

// PUT update hazard background
export const updateHazardBackground = async (id, fields) => {
  const res = await api.put(`/put/hazard-background/${id}`, fields, authHeadersJSON());
  return res.data;
};

// GET countermeasure plan by id_incident_format
export const getCountermeasurePlanByIncidentFormat = async (id_incident_format) => {
  const res = await api.get(`/countermeasure-plan/incident-format/${id_incident_format}`, authHeadersJSON());
  return res.data;
};

// POST create countermeasure plan record
export const createCountermeasurePlan = async (data) => {
  const res = await api.post("/countermeasure-plan", data, authHeadersJSON());
  return res.data;
};

// PUT update countermeasure plan record
export const updateCountermeasurePlan = async (id, fields) => {
  const res = await api.put(`/put/countermeasure-plan/${id}`, fields, authHeadersJSON());
  return res.data;
};

// GET all control hierarchy catalog entries
export const getControlHierarchies = async () => {
  const res = await api.get("/get/control-hierarchy", authHeadersJSON());
  return res.data;
};

// GET all verification method catalog entries
export const getVerificationMethods = async () => {
  const res = await api.get("/get/verification-method", authHeadersJSON());
  return res.data;
};

// GET analysis participants by incident format
export const getAnalysisParticipantsByIncidentFormat = async (id_incident_format) => {
  const res = await api.get(`/analysis-participant/incident-format/${id_incident_format}`, authHeadersJSON());
  return res.data;
};

// POST create analysis participant
export const createAnalysisParticipant = async (data) => {
  const res = await api.post("/analysis-participant", data, authHeadersJSON());
  return res.data;
};

// PUT update analysis participant
export const updateAnalysisParticipant = async (id, fields) => {
  const res = await api.put(`/put/analysis-participant/${id}`, fields, authHeadersJSON());
  return res.data;
};

// GET all cost centers
export const getCostCenters = async () => {
  const res = await api.get("/get/cost-center", authHeadersJSON());
  return res.data;
};

// DELETE factor tree
export const deleteFactorTree = async (id) => {
  const res = await api.delete(`/delete/factor-tree/${id}`, authHeadersJSON());
  return res.data;
};

// DELETE countermeasure plan
export const deleteCountermeasurePlan = async (id) => {
  const res = await api.delete(`/delete/countermeasure-plan/${id}`, authHeadersJSON());
  return res.data;
};

// DELETE analysis participant
export const deleteAnalysisParticipant = async (id) => {
  const res = await api.delete(`/delete/analysis-participant/${id}`, authHeadersJSON());
  return res.data;
};

// DELETE hazard background
export const deleteHazardBackground = async (id) => {
  const res = await api.delete(`/delete/hazard-background/${id}`, authHeadersJSON());
  return res.data;
};

// DELETE intervening factors
export const deleteInterveningFactor = async (id) => {
  const res = await api.delete(`/delete/intervening-factors/${id}`, authHeadersJSON());
  return res.data;
};

// download excel report
export const downloadIncidentExcel = async (id_incident) => {
  const res = await api.get(`/excel/${id_incident}`, {
    responseType: 'blob',
    ...authHeaders()
  });
  return res.data;
};

// Create incident image record in database
export const createIncidentImage = async (data) => {
  const res = await api.post("/incident-images", data, authHeadersJSON());
  return res.data;
};

// Get images by incident format ID
export const getImagesByIncidentFormat = async (id_incident_format) => {
  const res = await api.get(`/incident-images/incident-format/${id_incident_format}`, authHeadersJSON());
  return res.data;
};

// Delete incident image record from database
export const deleteIncidentImageApi = async (id) => {
  const res = await api.delete(`/delete/incident-images/${id}`, authHeadersJSON());
  return res.data;
};

