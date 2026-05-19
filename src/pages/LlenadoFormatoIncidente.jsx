import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/LlenadoFormatoIncidente.css";

const LlenadoFormatoIncidente = () => {
  const locationState = useLocation();
  const passedIncident = locationState.state?.incident || null;

  // Collapsible sections toggle state (first section open by default)
  const [openSections, setOpenSections] = useState({
    incident: true,
    incident_format: false,
    grafico: false,
    factor_tree: false,
    intervening_factors: false,
    hazard_background: false,
    contermeasure_plan: false,
    control_hierarchy: false,
    verification_method: false,
    analysis_participant: false,
    control: false,
  });

  // Local form state for demonstration and premium interactivity
  const [form, setForm] = useState({
    // Incident
    folio: passedIncident?.id ? `INC-2026-${passedIncident.id}` : (passedIncident?.folio || ""),
    incident_date: passedIncident?.date || passedIncident?.incident_date || "",
    incident_time: passedIncident?.time || passedIncident?.incident_time || "",
    id_plant: passedIncident?.id_plant || "",
    id_area: passedIncident?.id_area || "",
    location: passedIncident?.location || "",
    shift: passedIncident?.shift || "",
    severity: passedIncident?.level || passedIncident?.severity || "",
    status: passedIncident?.status || "abierto",
    incident_type: passedIncident?.incident_type || "",
    description: passedIncident?.description || "",
    immediate_actions: passedIncident?.immediate_actions || "",
    // Incident Format
    classification: "",
    department: "",
    direct_supervisor: "",
    junior_manager: "",
    cost_center: passedIncident?.id_cost_center || "",
    specific_activity: "",
    // Factor Tree
    event_description: passedIncident?.description || "",
    immediate_cause: passedIncident?.incident_mechanism || "",
    root_cause: passedIncident?.root_cause || "",
    system_cause: "",
    // Intervening Factors
    unsafe_act: "",
    unsafe_condition: "",
    human_factor: "",
    org_factor: "",
    // Hazard Background
    similar_incidents: "",
    past_audits: "",
    risk_assessment_done: "",
    // Countermeasure Plan
    countermeasure: "",
    responsible_user: "",
    deadline: "",
    countermeasure_status: "",
    // Control Hierarchy
    elimination: "",
    substitution: "",
    engineering_control: "",
    admin_control: "",
    epp: "",
    // Verification Method
    verification_type: "",
    verification_frequency: "",
    auditor_name: "",
    observation: "",
    // Control
    prepared_by: "",
    reviewed_by: "",
    approved_by: "",
    approval_date: "",
    document_version: "v1.0",
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Demonstration save handler
  const handleDemoSave = (e) => {
    e.preventDefault();
    alert("¡Borrador guardado localmente! (Lógica de conexión lista para integración)");
  };

  return (
    <div className="lfi-page animate-in">
      <div className="lfi-container">
        
        {/* Header Block */}
        <div className="lfi-header">
          <h1>Llenado de Formato de Incidente</h1>
          <p className="lfi-subtitle">Complete las secciones del análisis detallado de incidentes y contramedidas.</p>
        </div>

        {/* Top Control Bar */}
        <div className="lfi-top-actions glass">
          <span className="lfi-summary-badge">Borrador Local</span>
          <div className="lfi-btn-group">
            <button className="btn-secondary" onClick={() => window.history.back()}>
              Volver
            </button>
            <button className="btn-primary" onClick={handleDemoSave}>
              💾 Guardar Borrador
            </button>
          </div>
        </div>

        {/* ── 1. INCIDENT SECTION ── */}
        <div className={`lfi-card ${openSections.incident ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("incident")}>
            <span className="lfi-card-title">
              <span className="lfi-card-icon">🚨</span>
              1. Reporte de Incidente (incident)
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.incident && (
            <div className="lfi-card-body">
              <div className="lfi-form-grid">
                <div className="lfi-form-group">
                  <label>Folio del Incidente</label>
                  <input
                    name="folio"
                    value={form.folio}
                    onChange={handleInputChange}
                    placeholder="Ej. INC-2026-0042"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Fecha</label>
                  <input
                    name="incident_date"
                    type="date"
                    value={form.incident_date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Hora</label>
                  <input
                    name="incident_time"
                    type="time"
                    value={form.incident_time}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Planta</label>
                  <select name="id_plant" value={form.id_plant} onChange={handleInputChange}>
                    <option value="">Seleccione una planta</option>
                    <option value="1">Aguascalientes 1</option>
                    <option value="2">Aguascalientes 2</option>
                    <option value="3">CuernavacaCivac</option>
                  </select>
                </div>
                <div className="lfi-form-group">
                  <label>Área</label>
                  <select name="id_area" value={form.id_area} onChange={handleInputChange}>
                    <option value="">Seleccione un área</option>
                    <option value="1">Ensamble</option>
                    <option value="2">Pintura</option>
                    <option value="3">Estampado</option>
                    <option value="4">Carrocerías</option>
                  </select>
                </div>
                <div className="lfi-form-group">
                  <label>Ubicación Específica</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleInputChange}
                    placeholder="Ej. Línea A-3, estación de torque"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Turno</label>
                  <select name="shift" value={form.shift} onChange={handleInputChange}>
                    <option value="">Seleccione turno</option>
                    <option value="A">Turno A (Matutino)</option>
                    <option value="B">Turno B (Vespertino)</option>
                    <option value="C">Turno C (Nocturno)</option>
                  </select>
                </div>
                <div className="lfi-form-group">
                  <label>Gravedad del Incidente</label>
                  <select name="severity" value={form.severity} onChange={handleInputChange}>
                    <option value="">Seleccione gravedad</option>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
                <div className="lfi-form-group">
                  <label>Estatus</label>
                  <select name="status" value={form.status} onChange={handleInputChange}>
                    <option value="">Seleccione estatus</option>
                    <option value="abierto">Abierto</option>
                    <option value="en investigacion">En Investigación</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>
                <div className="lfi-form-group">
                  <label>Tipo de Incidente</label>
                  <select name="incident_type" value={form.incident_type} onChange={handleInputChange}>
                    <option value="">Seleccione tipo</option>
                    <option value="Accidente con lesión">Accidente con lesión</option>
                    <option value="Casi accidente (Near Miss)">Casi accidente (Near Miss)</option>
                    <option value="Incidente sin lesión">Incidente sin lesión</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="lfi-form-group full-width">
                  <label>Descripción del Evento</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Escriba aquí los detalles y secuencia del evento..."
                  />
                </div>
                <div className="lfi-form-group full-width">
                  <label>Acciones Inmediatas Implementadas</label>
                  <textarea
                    name="immediate_actions"
                    value={form.immediate_actions}
                    onChange={handleInputChange}
                    placeholder="Acciones de contención tomadas al momento de ocurrir el evento..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. INCIDENT FORMAT SECTION ── */}
        <div className={`lfi-card ${openSections.incident_format ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("incident_format")}>
            <span className="lfi-card-title">
              <span className="lfi-card-icon">📋</span>
              2. Datos Generales del Formato (incident_format)
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.incident_format && (
            <div className="lfi-card-body">
              <div className="lfi-form-grid">
                <div className="lfi-form-group">
                  <label>Clasificación del Formato</label>
                  <select name="classification" value={form.classification} onChange={handleInputChange}>
                    <option value="">Seleccione clasificación</option>
                    <option value="Estándar">Formato Estándar</option>
                    <option value="Urgente">Formato de Reporte Urgente</option>
                    <option value="Grave">Investigación Mayor</option>
                  </select>
                </div>
                <div className="lfi-form-group">
                  <label>Departamento</label>
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleInputChange}
                    placeholder="Ej. Control de Calidad / Logística"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Supervisor Directo</label>
                  <input
                    name="direct_supervisor"
                    value={form.direct_supervisor}
                    onChange={handleInputChange}
                    placeholder="Nombre del supervisor a cargo"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Gerente Junior</label>
                  <input
                    name="junior_manager"
                    value={form.junior_manager}
                    onChange={handleInputChange}
                    placeholder="Nombre del Junior Manager del área"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Centro de Costos</label>
                  <input
                    name="cost_center"
                    value={form.cost_center}
                    onChange={handleInputChange}
                    placeholder="Ej. CC-QA-031"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Actividad Específica Realizada</label>
                  <input
                    name="specific_activity"
                    value={form.specific_activity}
                    onChange={handleInputChange}
                    placeholder="Actividad al momento de la falla/incidente"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. INCIDENT GRAPH SECTION ── */}
        <div className={`lfi-card ${openSections.grafico ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("grafico")}>
            <span className="lfi-card-title">
              <span className="lfi-card-icon">🎨</span>
              3. Gráfico del Incidente
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.grafico && (
            <div className="lfi-card-body">
              <div
                className="lfi-upload-zone"
                onClick={() => document.getElementById("lfi-file-input").click()}
              >
                <div className="lfi-upload-icon">📁</div>
                <div className="lfi-upload-text">
                  <strong>Haz clic para examinar</strong> o arrastra imágenes del incidente aquí
                </div>
                <span className="lfi-upload-btn">Seleccionar Archivo</span>
                <input
                  id="lfi-file-input"
                  type="file"
                  className="lfi-upload-input"
                  accept="image/*"
                  onChange={() => alert("Simulación: Imagen cargada temporalmente en memoria")}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 4. FACTOR TREE SECTION ── */}
        <div className={`lfi-card ${openSections.factor_tree ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("factor_tree")}>
            <span className="lfi-card-title">
              <span className="lfi-card-icon">🌿</span>
              4. Árbol de Factores (factor_tree)
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.factor_tree && (
            <div className="lfi-card-body">
              <div className="lfi-form-grid">
                <div className="lfi-form-group full-width">
                  <label>Descripción General de Hechos</label>
                  <textarea
                    name="event_description"
                    value={form.event_description}
                    onChange={handleInputChange}
                    placeholder="Paso a paso de lo que llevó directamente al evento..."
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Causa Inmediata (Factor Directo)</label>
                  <textarea
                    name="immediate_cause"
                    value={form.immediate_cause}
                    onChange={handleInputChange}
                    placeholder="El desencadenante material directo..."
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Causa Raíz (Factor Latente)</label>
                  <textarea
                    name="root_cause"
                    value={form.root_cause}
                    onChange={handleInputChange}
                    placeholder="¿Por qué ocurrió la falla? (Ej. Falta de mantenimiento)"
                  />
                </div>
                <div className="lfi-form-group full-width">
                  <label>Causa Sistémica (Falla Organizacional)</label>
                  <textarea
                    name="system_cause"
                    value={form.system_cause}
                    onChange={handleInputChange}
                    placeholder="Falta de política, procedimientos obsoletos, falta de auditorías..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 5. INTERVENING FACTORS SECTION ── */}
        <div className={`lfi-card ${openSections.intervening_factors ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("intervening_factors")}>
            <span className="lfi-card-title">
              <span className="lfi-card-icon">⚡</span>
              5. Factores que Intervienen (intervening_factors)
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.intervening_factors && (
            <div className="lfi-card-body">
              <div className="lfi-form-grid">
                <div className="lfi-form-group">
                  <label>Acto Inseguro</label>
                  <textarea
                    name="unsafe_act"
                    value={form.unsafe_act}
                    onChange={handleInputChange}
                    placeholder="Ej. Operar sin equipo de protección, omitir pasos de bloqueo..."
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Condición Insegura</label>
                  <textarea
                    name="unsafe_condition"
                    value={form.unsafe_condition}
                    onChange={handleInputChange}
                    placeholder="Ej. Piso resbaladizo, sensores deshabilitados, guardas rotas..."
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Factor Humano</label>
                  <textarea
                    name="human_factor"
                    value={form.human_factor}
                    onChange={handleInputChange}
                    placeholder="Fatiga, distracción, falta de capacitación del operador..."
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Factor Organizacional</label>
                  <textarea
                    name="org_factor"
                    value={form.org_factor}
                    onChange={handleInputChange}
                    placeholder="Presión de tiempo, supervisión inadecuada, políticas débiles..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 6. HAZARD BACKGROUND SECTION ── */}
        <div className={`lfi-card ${openSections.hazard_background ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("hazard_background")}>
            <span className="lfi-card-title">
              <span className="lfi-card-icon">⏳</span>
              6. Antecedentes de Riesgo (hazard_background)
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.hazard_background && (
            <div className="lfi-card-body">
              <div className="lfi-form-grid">
                <div className="lfi-form-group">
                  <label>Incidentes Similares Previos</label>
                  <textarea
                    name="similar_incidents"
                    value={form.similar_incidents}
                    onChange={handleInputChange}
                    placeholder="¿Se han registrado incidentes de esta naturaleza en el área?"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Hallazgos/Auditorías Previas</label>
                  <textarea
                    name="past_audits"
                    value={form.past_audits}
                    onChange={handleInputChange}
                    placeholder="Observaciones de seguridad previas registradas para este equipo/proceso..."
                  />
                </div>
                <div className="lfi-form-group">
                  <label>¿Contaba con Análisis de Riesgo previo?</label>
                  <select
                    name="risk_assessment_done"
                    value={form.risk_assessment_done}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="si">Sí, vigente y socializado</option>
                    <option value="no">No se tenía documentado</option>
                    <option value="obsoleto">Sí, pero desactualizado</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 7. COUNTERMEASURE PLAN SECTION ── */}
        <div className={`lfi-card ${openSections.contermeasure_plan ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("contermeasure_plan")}>
            <span className="lfi-card-title">
              <span className="lfi-card-icon">🛠️</span>
              7. Plan de Contramedidas (contermeasure_plan)
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.contermeasure_plan && (
            <div className="lfi-card-body">
              <div className="lfi-form-grid">
                <div className="lfi-form-group full-width">
                  <label>Acción / Contramedida Propuesta</label>
                  <input
                    name="countermeasure"
                    value={form.countermeasure}
                    onChange={handleInputChange}
                    placeholder="Describa la solución de ingeniería o control administrativo..."
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Usuario Responsable</label>
                  <input
                    name="responsible_user"
                    value={form.responsible_user}
                    onChange={handleInputChange}
                    placeholder="Nombre o ID del responsable"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Fecha Límite (Compromiso)</label>
                  <input
                    name="deadline"
                    type="date"
                    value={form.deadline}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Estatus de la Contramedida</label>
                  <select
                    name="countermeasure_status"
                    value={form.countermeasure_status}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccione estatus</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Implementada">Implementada</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 8. CONTROL HIERARCHY SECTION ── */}
        <div className={`lfi-card ${openSections.control_hierarchy ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("control_hierarchy")}>
            <span className="lfi-card-title">
              <span className="lfi-card-icon">🛡️</span>
              8. Jerarquía de Controles (control_hierarchy)
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.control_hierarchy && (
            <div className="lfi-card-body">
              <div className="lfi-form-grid">
                <div className="lfi-form-group">
                  <label>1. Eliminación</label>
                  <textarea
                    name="elimination"
                    value={form.elimination}
                    onChange={handleInputChange}
                    placeholder="¿Se puede eliminar físicamente el peligro?"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>2. Sustitución</label>
                  <textarea
                    name="substitution"
                    value={form.substitution}
                    onChange={handleInputChange}
                    placeholder="¿Se puede reemplazar el peligro por algo menos riesgoso?"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>3. Control de Ingeniería</label>
                  <textarea
                    name="engineering_control"
                    value={form.engineering_control}
                    onChange={handleInputChange}
                    placeholder="Guardas, barreras físicas, sistemas de ventilación..."
                  />
                </div>
                <div className="lfi-form-group">
                  <label>4. Control Administrativo</label>
                  <textarea
                    name="admin_control"
                    value={form.admin_control}
                    onChange={handleInputChange}
                    placeholder="Señales, advertencias, roles de rotación, JSA..."
                  />
                </div>
                <div className="lfi-form-group full-width">
                  <label>5. Equipo de Protección Personal (EPP)</label>
                  <textarea
                    name="epp"
                    value={form.epp}
                    onChange={handleInputChange}
                    placeholder="Lentes, tapones, guantes anti-corte, arnés, etc."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 9. VERIFICATION METHOD SECTION ── */}
        <div className={`lfi-card ${openSections.verification_method ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("verification_method")}>
            <span className="lfi-card-title">
              <span className="lfi-card-icon">🔍</span>
              9. Métodos de Verificación (verification_method)
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.verification_method && (
            <div className="lfi-card-body">
              <div className="lfi-form-grid">
                <div className="lfi-form-group">
                  <label>Tipo de Verificación</label>
                  <select
                    name="verification_type"
                    value={form.verification_type}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccione tipo</option>
                    <option value="Auditoría en piso">Auditoría en piso</option>
                    <option value="Revisión de bitácora">Revisión de bitácora</option>
                    <option value="Inspección visual">Inspección visual</option>
                  </select>
                </div>
                <div className="lfi-form-group">
                  <label>Frecuencia de Verificación</label>
                  <select
                    name="verification_frequency"
                    value={form.verification_frequency}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccione frecuencia</option>
                    <option value="Diaria">Diaria</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Mensual">Mensual</option>
                  </select>
                </div>
                <div className="lfi-form-group">
                  <label>Nombre del Verificador / Auditor</label>
                  <input
                    name="auditor_name"
                    value={form.auditor_name}
                    onChange={handleInputChange}
                    placeholder="Ej. Ing. Carlos Ruiz"
                  />
                </div>
                <div className="lfi-form-group full-width">
                  <label>Observaciones del Método de Verificación</label>
                  <textarea
                    name="observation"
                    value={form.observation}
                    onChange={handleInputChange}
                    placeholder="Describa cómo y con qué criterios se validará la efectividad de la contramedida..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 10. ANALYSIS PARTICIPANT SECTION ── */}
        <div className={`lfi-card ${openSections.analysis_participant ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("analysis_participant")}>
            <span className="lfi-card-title">
              <span className="lfi-card-icon">👥</span>
              10. Participantes del Análisis (analysis_participant)
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.analysis_participant && (
            <div className="lfi-card-body">
              <div className="lfi-participant-header">
                <span>Nombre</span>
                <span>Puesto / Rol</span>
                <span>Departamento</span>
                <span>Firma / Estatus</span>
              </div>
              
              <div className="lfi-participant-row">
                <input placeholder="Nombre Completo" defaultValue="Ing. Jorge González" />
                <input placeholder="Puesto" defaultValue="Líder de Seguridad Industrial" />
                <input placeholder="Departamento" defaultValue="Seguridad e Higiene" />
                <select defaultValue="Firmado">
                  <option value="Firmado">Firmado</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              </div>

              <div className="lfi-participant-row">
                <input placeholder="Nombre Completo" defaultValue="Carlos Mendoza" />
                <input placeholder="Puesto" defaultValue="Operador Especializado" />
                <input placeholder="Departamento" defaultValue="Ensamble Planta 1" />
                <select defaultValue="Firmado">
                  <option value="Firmado">Firmado</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── 11. CONTROL SECTION ── */}
        <div className={`lfi-card ${openSections.control ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("control")}>
            <span className="lfi-card-title">
              <span className="lfi-card-icon">⚙️</span>
              11. Control de Formato (control)
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.control && (
            <div className="lfi-card-body">
              <div className="lfi-form-grid">
                <div className="lfi-form-group">
                  <label>Elaborado Por</label>
                  <input
                    name="prepared_by"
                    value={form.prepared_by}
                    onChange={handleInputChange}
                    placeholder="Firma/Nombre del elaborador"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Revisado Por</label>
                  <input
                    name="reviewed_by"
                    value={form.reviewed_by}
                    onChange={handleInputChange}
                    placeholder="Firma/Nombre del revisor"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Aprobado Por</label>
                  <input
                    name="approved_by"
                    value={form.approved_by}
                    onChange={handleInputChange}
                    placeholder="Firma/Nombre del aprobador"
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Fecha de Aprobación</label>
                  <input
                    name="approval_date"
                    type="date"
                    value={form.approval_date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="lfi-form-group">
                  <label>Versión del Formato</label>
                  <input
                    name="document_version"
                    value={form.document_version}
                    onChange={handleInputChange}
                    placeholder="Ej. v1.2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LlenadoFormatoIncidente;
