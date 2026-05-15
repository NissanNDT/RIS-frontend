import React, { useState, useRef, useEffect } from "react";
import { createIncident } from "../services/incidentService";
import api from "../api/axios";
import "../App.css";
import "../styles/ReporteDeIncidentes.css";

const GRAVEDAD = ["G", "U", "R", "FR1", "FR0"];

const ReporteDeIncidentes = () => {
  const fileInputRef = useRef(null);

  const [plants, setPlants] = useState([]);
  const [areas, setAreas] = useState([]);
  const [costCenters, setCostCenters] = useState([]);

  const [formData, setFormData] = useState({
    id_plant: 1,
    id_area: 1,
    incident_date: "",
    incident_time: "",
    location: "",
    severity: "",
    injury: "",
    description: "",
    incident_mechanism: "",
    root_cause: "",
    id_cost_center: 1,
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  /* FETCH */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, aRes, cRes] = await Promise.all([
          api.get("/get/plants"),
          api.get("/get/areas"),
          api.get("/get/cost-center"),
        ]);

        setPlants(pRes.data);
        setAreas(aRes.data);
        setCostCenters(cRes.data);

      } catch (err) {
        console.error("ERROR FETCH:", err.response || err);

        if (err.response?.status === 401) {
          setError("Sesión expirada. Inicia sesión nuevamente.");
        }
      }
    };

    fetchData();
  }, []);

  /* HELPERS */
  const levelMap = {
    G: "G",
    U: "U",
    R: "R",
    FR1: "FR1",
    FR0: "FR0",
  };

  /* HANDLER */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* SUBMIT */
  /* SUBMIT */
const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  setError("");

  try {
    // pgClient FORMATO FECHA dd/mm/yyyy
    const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0]; //  yyyy-mm-dd
};


    // pgClient FORMATO HORA 12h AM/PM
    const formatTime = (time) => {
      const [hour, minute] = time.split(":");

      const d = new Date();
      d.setHours(hour, minute, 0);

      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    };

    // pgClient PAYLOAD COMO JSON (NO FormData)
    const payload = {
      date: formatDate(formData.incident_date),
      time: formatTime(formData.incident_time),
      level: levelMap[formData.severity],
      location: formData.location,
      injury: formData.injury,
      description: formData.description,
      id_area: Number(formData.id_area),
      id_plant: Number(formData.id_plant),
      incident_mechanism: formData.incident_mechanism,
      root_cause: formData.root_cause,
      id_cost_center: Number(formData.id_cost_center),
    };

    console.log("JSON", payload);

    await createIncident(payload);

    setSuccess(true);

  } catch (err) {
    console.error(err.response || err);
    log.console(err)

    if (err.response?.status === 401) {
      setError("Sesión expirada. Vuelve a iniciar sesión.");
    } else {
      setError(err?.response?.data?.message || "Error al enviar");
    }
  } finally {
    setSubmitting(false);
  }
};

  /* SUCCESS */
  if (success) {
    return (
      <div className="ir-page">
        <div className="ir-success-card animate-in">
          <div className="ir-success-icon">✓</div>
          <h2>¡Reporte enviado!</h2>
          <p>Se guardó correctamente en la base de datos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ir-page">
      <div className="ir-header">
        <h1 className="ir-title">
          Reporte de <span className="ir-title-highlight">Incidentes</span>
        </h1>
      </div>

      <form className="ir-card" onSubmit={handleSubmit}>
        <div className="ir-grid ir-grid-2">

          <label className="ir-label">
            Planta *
            <select name="id_plant" value={formData.id_plant} onChange={handleChange} required>
              <option value="">Selecciona</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          <label className="ir-label">
            Área *
            <select name="id_area" value={formData.id_area} onChange={handleChange} required>
              <option value="">Selecciona</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || a.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="ir-label">
            Fecha *
            <input type="date" name="incident_date" onChange={handleChange} required />
          </label>

          <label className="ir-label">
            Hora *
            <input type="time" name="incident_time" onChange={handleChange} required />
          </label>

          <label className="ir-label">
            Nivel *
            <select name="severity" onChange={handleChange} required>
              <option value="">Selecciona</option>
              {GRAVEDAD.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>

          <label className="ir-label">
            Lugar *
            <input name="location" onChange={handleChange} required />
          </label>

          <label className="ir-label">
            Lesión *
            <input name="injury" onChange={handleChange} required />
          </label>

          <label className="ir-label">
            Centro de costo *
            <select
              name="id_cost_center"
              value={formData.id_cost_center}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona</option>
              {costCenters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="ir-label ir-full-width">
            Mecanismo del incidente *
            <input name="incident_mechanism" onChange={handleChange} required />
          </label>

          <label className="ir-label ir-full-width">
            Causa raíz *
            <input name="root_cause" onChange={handleChange} required />
          </label>

          <label className="ir-label ir-full-width">
            Descripción *
            <textarea name="description" onChange={handleChange} rows={4} required />
          </label>

        </div>

        {error && <div className="ir-error-msg">{error}</div>}

        <button className="ir-btn-primary" disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar Reporte"}
        </button>
      </form>
    </div>
  );
};

export default ReporteDeIncidentes;
