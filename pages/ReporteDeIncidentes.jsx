import React, { useState, useRef } from "react";
import { createIncident } from "../services/incidentService";
import "../App.css";
import "../styles/ReporteDeIncidentes.css";

/* ── Opciones de catálogo ─────────────────────────────────────── */
const PLANTAS = ["Planta A – Aguascalientes 1", "Planta B – Aguascalientes 2", "Planta C – CIVAC"];
const AREAS = [
  "Producción", "Mantenimiento", "Logística", "Calidad",
  "Ingeniería", "Seguridad", "Recursos Humanos", "Administración",
];
const TIPOS_INCIDENTE = [
  "Accidente con lesión", "Casi accidente (Near Miss)", "Incidente sin lesión",
  "Enfermedad ocupacional", "Daño a propiedad / equipo", "Derrame / Fuga",
  "Incendio / Explosión", "Otro",
];
const GRAVEDAD = ["Baja", "Media", "Alta", "Crítica"];
const TURNOS = ["Matutino (06:00–14:00)", "Vespertino (14:00–22:00)", "Nocturno (22:00–06:00)"];
const PARTES_CUERPO = [
  "Cabeza / Cráneo", "Ojos", "Oídos", "Nariz / Cara", "Cuello",
  "Hombro izquierdo", "Hombro derecho", "Brazo izquierdo", "Brazo derecho",
  "Mano izquierda", "Mano derecha", "Tronco / Espalda", "Cadera / Pelvis",
  "Pierna izquierda", "Pierna derecha", "Pie izquierdo", "Pie derecho",
  "Sin lesión corporal",
];
const CAUSAS_INMEDIATAS = [
  "Acto inseguro", "Condición insegura", "Falla de equipo/maquinaria",
  "Falta de EPP", "Procedimiento no seguido", "Fatiga / Distracción", "Otro",
];

/* ── Componente principal ──────────────────────────────────────── */
const ReporteDeIncidentes = () => {
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;

  const [formData, setFormData] = useState({
    /* Paso 1 – Identificación */
    id_plant: "",
    id_area: "",
    shift: "",
    incident_date: "",
    incident_time: "",
    location: "",

    /* Paso 2 – Descripción */
    incident_type: "",
    severity: "",
    description: "",
    immediate_cause: "",
    body_part_affected: "",
    witnesses: "",

    /* Paso 3 – Respuesta */
    immediate_actions: "",
    corrective_actions: "",
    id_responsible_user: "",
    follow_up_date: "",
    image: null,
  });

  const [imageName, setImageName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /* ── Handlers ──────────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImageName(file.name);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImageName(file.name);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleNext = (e) => {
    e.preventDefault();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (val !== null && val !== "") payload.append(key, val);
    });

    try {
      await createIncident(payload);
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ||
        "Error al enviar el reporte. Inténtalo de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      id_plant: "", id_area: "", shift: "", incident_date: "",
      incident_time: "", location: "", incident_type: "", severity: "",
      description: "", immediate_cause: "", body_part_affected: "",
      witnesses: "", immediate_actions: "", corrective_actions: "",
      id_responsible_user: "", follow_up_date: "", image: null,
    });
    setImageName("");
    setStep(1);
    setSubmitSuccess(false);
    setSubmitError("");
  };

  /* ── Pantalla de éxito ──────────────────────────────────────── */
  if (submitSuccess) {
    return (
      <div className="ir-page">
        <div className="ir-success-card animate-in">
          <div className="ir-success-icon">✓</div>
          <h2>¡Reporte enviado!</h2>
          <p>Tu reporte de incidente ha sido registrado correctamente y será atendido a la brevedad.</p>
          <button className="ir-btn-primary" onClick={handleReset}>
            Registrar otro incidente
          </button>
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="ir-page">
      {/* Header */}
      <div className="ir-header animate-in">
        <div className="ir-header-badge">
          <span className="ir-badge-dot" />
          Seguridad Industrial
        </div>
        <h1 className="ir-title">
          Reporte de <span className="ir-title-highlight">Incidentes</span>
        </h1>
        <p className="ir-subtitle">
          Registra de forma detallada cualquier incidente ocurrido en planta.
          La información es confidencial y sirve para mejorar la seguridad.
        </p>
      </div>

      {/* Stepper */}
      <div className="ir-stepper animate-in animate-in-delay-1">
        {[
          { n: 1, label: "Identificación" },
          { n: 2, label: "Descripción" },
          { n: 3, label: "Respuesta" },
        ].map(({ n, label }) => (
          <React.Fragment key={n}>
            <div className={`ir-step ${step === n ? "ir-step--active" : ""} ${step > n ? "ir-step--done" : ""}`}>
              <div className="ir-step-circle">
                {step > n ? <span className="ir-step-check">✓</span> : n}
              </div>
              <span className="ir-step-label">{label}</span>
            </div>
            {n < TOTAL_STEPS && <div className={`ir-step-line ${step > n ? "ir-step-line--done" : ""}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Formulario */}
      <div className="ir-form-wrapper animate-in animate-in-delay-2">

        {/* ── PASO 1 – IDENTIFICACIÓN ─────────────────────────── */}
        {step === 1 && (
          <form className="ir-card" onSubmit={handleNext}>
            <div className="ir-card-title">
              <span className="ir-card-icon">📍</span>
              Identificación del Incidente
            </div>

            <div className="ir-grid ir-grid-2">
              <label className="ir-label">
                Planta *
                <select id="ir-plant" name="id_plant" value={formData.id_plant} onChange={handleChange} required>
                  <option value="">Selecciona la planta</option>
                  {PLANTAS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>

              <label className="ir-label">
                Área *
                <select id="ir-area" name="id_area" value={formData.id_area} onChange={handleChange} required>
                  <option value="">Selecciona el área</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>

              <label className="ir-label">
                Turno *
                <select id="ir-shift" name="shift" value={formData.shift} onChange={handleChange} required>
                  <option value="">Selecciona el turno</option>
                  {TURNOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>

              <label className="ir-label">
                Fecha del Incidente *
                <input
                  id="ir-date"
                  type="date"
                  name="incident_date"
                  value={formData.incident_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </label>

              <label className="ir-label">
                Hora del Incidente *
                <input
                  id="ir-time"
                  type="time"
                  name="incident_time"
                  value={formData.incident_time}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="ir-label">
                Lugar / Proceso / Equipo / Operación *
                <input
                  id="ir-location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Ej. Línea de ensamble 3 – Robot 7"
                  required
                />
              </label>
            </div>

            <div className="ir-form-actions">
              <div />
              <button id="ir-next-1" type="submit" className="ir-btn-primary">
                Siguiente <span className="ir-btn-arrow">→</span>
              </button>
            </div>
          </form>
        )}

        {/* ── PASO 2 – DESCRIPCIÓN ──────────────────────────────── */}
        {step === 2 && (
          <form className="ir-card" onSubmit={handleNext}>
            <div className="ir-card-title">
              <span className="ir-card-icon">📋</span>
              Descripción del Incidente
            </div>

            <div className="ir-grid ir-grid-2">
              <label className="ir-label">
                Tipo de Incidente *
                <select id="ir-type" name="incident_type" value={formData.incident_type} onChange={handleChange} required>
                  <option value="">Selecciona el tipo</option>
                  {TIPOS_INCIDENTE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>

              <label className="ir-label">
                Gravedad / Severidad *
                <select id="ir-severity" name="severity" value={formData.severity} onChange={handleChange} required>
                  <option value="">Selecciona la gravedad</option>
                  {GRAVEDAD.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>

              <label className="ir-label">
                Causa Inmediata *
                <select id="ir-cause" name="immediate_cause" value={formData.immediate_cause} onChange={handleChange} required>
                  <option value="">Selecciona la causa</option>
                  {CAUSAS_INMEDIATAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="ir-label">
                Parte del Cuerpo Afectada *
                <select id="ir-body" name="body_part_affected" value={formData.body_part_affected} onChange={handleChange} required>
                  <option value="">Selecciona la parte</option>
                  {PARTES_CUERPO.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>

              <label className="ir-label ir-full-width">
                Descripción Detallada del Incidente *
                <textarea
                  id="ir-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe con el mayor detalle posible qué ocurrió, cómo ocurrió y las circunstancias del incidente…"
                  rows={5}
                  required
                />
              </label>

              <label className="ir-label ir-full-width">
                Testigos (nombres y número de empleado)
                <input
                  id="ir-witnesses"
                  type="text"
                  name="witnesses"
                  value={formData.witnesses}
                  onChange={handleChange}
                  placeholder="Ej. Juan Pérez #12345, María López #67890"
                />
              </label>
            </div>

            {/* Severity indicator */}
            {formData.severity && (
              <div className={`ir-severity-indicator ir-severity-${formData.severity.toLowerCase()}`}>
                <span className="ir-severity-dot" />
                Gravedad seleccionada: <strong>{formData.severity}</strong>
                {formData.severity === "Crítica" && " — Se notificará a supervisión de inmediato."}
              </div>
            )}

            <div className="ir-form-actions">
              <button id="ir-back-2" type="button" className="ir-btn-secondary" onClick={handleBack}>
                <span className="ir-btn-arrow">←</span> Atrás
              </button>
              <button id="ir-next-2" type="submit" className="ir-btn-primary">
                Siguiente <span className="ir-btn-arrow">→</span>
              </button>
            </div>
          </form>
        )}

        {/* ── PASO 3 – RESPUESTA ───────────────────────────────── */}
        {step === 3 && (
          <form className="ir-card" onSubmit={handleSubmit}>
            <div className="ir-card-title">
              <span className="ir-card-icon">🛠️</span>
              Acciones y Seguimiento
            </div>

            <div className="ir-grid ir-grid-2">
              <label className="ir-label ir-full-width">
                Acciones Inmediatas Tomadas *
                <textarea
                  id="ir-immediate-actions"
                  name="immediate_actions"
                  value={formData.immediate_actions}
                  onChange={handleChange}
                  placeholder="Describe las acciones de contención o primeros auxilios realizados tras el incidente…"
                  rows={4}
                  required
                />
              </label>

              <label className="ir-label ir-full-width">
                Acciones Correctivas / Preventivas Propuestas
                <textarea
                  id="ir-corrective-actions"
                  name="corrective_actions"
                  value={formData.corrective_actions}
                  onChange={handleChange}
                  placeholder="Describe las medidas para evitar que el incidente se repita…"
                  rows={4}
                />
              </label>

              <label className="ir-label">
                Responsable de Seguimiento
                <input
                  id="ir-responsible"
                  type="text"
                  name="id_responsible_user"
                  value={formData.id_responsible_user}
                  onChange={handleChange}
                  placeholder="Nombre o número de empleado"
                />
              </label>

              <label className="ir-label">
                Fecha Límite de Seguimiento
                <input
                  id="ir-follow-up"
                  type="date"
                  name="follow_up_date"
                  value={formData.follow_up_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                />
              </label>
            </div>

            {/* Image upload drop zone */}
            <div className="ir-upload-section">
              <span className="ir-label-text">Evidencia Fotográfica</span>
              <div
                className={`ir-dropzone ${formData.image ? "ir-dropzone--has-file" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                aria-label="Subir imagen del incidente"
              >
                <input
                  ref={fileInputRef}
                  id="ir-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                {formData.image ? (
                  <div className="ir-dropzone-file">
                    <span className="ir-dropzone-icon">🖼️</span>
                    <span className="ir-dropzone-filename">{imageName}</span>
                    <span className="ir-dropzone-change">Haz clic para cambiar</span>
                  </div>
                ) : (
                  <div className="ir-dropzone-empty">
                    <span className="ir-dropzone-icon">📷</span>
                    <span className="ir-dropzone-text">
                      Arrastra una imagen aquí o <span className="ir-dropzone-link">selecciona archivo</span>
                    </span>
                    <span className="ir-dropzone-hint">PNG, JPG, WEBP — máx. 10 MB</span>
                  </div>
                )}
              </div>
            </div>

            {submitError && (
              <div className="ir-error-msg" role="alert">{submitError}</div>
            )}

            <div className="ir-form-actions">
              <button id="ir-back-3" type="button" className="ir-btn-secondary" onClick={handleBack}>
                <span className="ir-btn-arrow">←</span> Atrás
              </button>
              <button
                id="ir-submit"
                type="submit"
                className="ir-btn-primary ir-btn-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="ir-spinner" />
                    Enviando…
                  </>
                ) : (
                  "Enviar Reporte"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReporteDeIncidentes;
