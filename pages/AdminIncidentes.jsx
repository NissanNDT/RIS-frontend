import React, { useState, useEffect, useMemo, useRef } from "react";
import { getAllIncidents, updateIncident } from "../services/incidentService";
import "../App.css";
import "../styles/AdmininIncidentes.css";

/* ── Catálogos ─────────────────────────────────────────────── */
const TIPO_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "Accidente con lesión", label: "Accidente con lesión" },
  { value: "Casi accidente (Near Miss)", label: "Near Miss" },
  { value: "Incidente sin lesión", label: "Sin lesión" },
  { value: "Enfermedad ocupacional", label: "Enfermedad ocupacional" },
  { value: "Daño a propiedad / equipo", label: "Daño a propiedad" },
  { value: "Derrame / Fuga", label: "Derrame / Fuga" },
  { value: "Incendio / Explosión", label: "Incendio / Explosión" },
  { value: "Otro", label: "Otro" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "Baja", label: "Baja" },
  { value: "Media", label: "Media" },
  { value: "Alta", label: "Alta" },
  { value: "Crítica", label: "Crítica" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "abierto", label: "Abierto" },
  { value: "en investigacion", label: "En Investigación" },
  { value: "cerrado", label: "Cerrado" },
];

const STATUS_COLORS = {
  abierto: "#E53935",
  "en investigacion": "#FB8C00",
  cerrado: "#43A047",
};

const SEVERITY_COLORS = {
  Baja: "#43A047",
  Media: "#FB8C00",
  Alta: "#E53935",
  Crítica: "#B71C1C",
};

/* ── Demo data ─────────────────────────────────────────────── */
const DEMO = [
  {
    id: 1,
    id_plant: "Planta A – Aguascalientes 1",
    id_area: "Producción",
    shift: "Matutino (06:00–14:00)",
    incident_date: "2026-05-10",
    incident_time: "08:30",
    location: "Línea 3, Robot 7",
    incident_type: "Casi accidente (Near Miss)",
    severity: "Media",
    description: "Operador casi atrapado por brazo robótico al ingresar sin bloqueo LOTO.",
    immediate_cause: "Procedimiento no seguido",
    body_part_affected: "Brazo derecho",
    witnesses: "Carlos Méndez #11234",
    immediate_actions: "Paro de línea, revisión de barrera de seguridad.",
    corrective_actions: "Refuerzo de capacitación LOTO. Instalación de interlock adicional.",
    id_responsible_user: "Ing. Ramírez #4521",
    follow_up_date: "2026-05-20",
    status: "en investigacion",
    created_at: "2026-05-10T10:00:00",
  },
  {
    id: 2,
    id_plant: "Planta B – Aguascalientes 2",
    id_area: "Mantenimiento",
    shift: "Vespertino (14:00–22:00)",
    incident_date: "2026-05-08",
    incident_time: "15:45",
    location: "Subestación eléctrica B-12",
    incident_type: "Accidente con lesión",
    severity: "Alta",
    description: "Técnico sufrió quemadura eléctrica de primer grado en mano izquierda.",
    immediate_cause: "Falta de EPP",
    body_part_affected: "Mano izquierda",
    witnesses: "Pedro Salinas #8801",
    immediate_actions: "Primeros auxilios, traslado a enfermería, reporte a supervisión.",
    corrective_actions: "Auditoría de EPP en turno vespertino. Revisión de permisos de trabajo.",
    id_responsible_user: "Ing. Torres #3310",
    follow_up_date: "2026-05-18",
    status: "abierto",
    created_at: "2026-05-08T16:30:00",
  },
  {
    id: 3,
    id_plant: "Planta A – Aguascalientes 1",
    id_area: "Logística",
    shift: "Nocturno (22:00–06:00)",
    incident_date: "2026-05-05",
    incident_time: "23:10",
    location: "Almacén MP, Rack 4",
    incident_type: "Daño a propiedad / equipo",
    severity: "Baja",
    description: "Montacargas impactó rack de materiales, sin lesiones.",
    immediate_cause: "Falla de equipo/maquinaria",
    body_part_affected: "Sin lesión corporal",
    witnesses: "—",
    immediate_actions: "Área acordonada, inspección estructural del rack.",
    corrective_actions: "Mantenimiento correctivo al montacargas. Reparación de rack.",
    id_responsible_user: "Lic. Flores #5540",
    follow_up_date: "2026-05-12",
    status: "cerrado",
    created_at: "2026-05-05T23:30:00",
  },
];

/* ── Helpers ───────────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtDateInput = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");

/* ════════════════════════════════════════════════════════════ */
const AdminIncidentes = () => {
  const printRef = useRef(null);

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  /* fetch */
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllIncidents();
      setIncidents(Array.isArray(data) ? data : data.data || []);
    } catch {
      setIncidents(DEMO);
    } finally {
      setLoading(false);
    }
  };

  /* filter */
  const filtered = useMemo(() => incidents.filter((i) => {
    const s = search.toLowerCase();
    const matchSearch = !search ||
      String(i.id).includes(s) ||
      i.location?.toLowerCase().includes(s) ||
      i.description?.toLowerCase().includes(s) ||
      i.id_area?.toLowerCase().includes(s);
    return matchSearch &&
      (!filterType || i.incident_type === filterType) &&
      (!filterSeverity || i.severity === filterSeverity) &&
      (!filterStatus || i.status === filterStatus);
  }), [incidents, search, filterType, filterSeverity, filterStatus]);

  /* detail modal */
  const detailItem = incidents.find((i) => i.id === detailId) || null;

  /* edit */
  const startEdit = (inc) => {
    setEditingId(inc.id);
    setEditForm({
      incident_type: inc.incident_type || "",
      severity: inc.severity || "",
      status: inc.status || "",
      description: inc.description || "",
      immediate_actions: inc.immediate_actions || "",
      corrective_actions: inc.corrective_actions || "",
      id_responsible_user: inc.id_responsible_user || "",
      follow_up_date: fmtDateInput(inc.follow_up_date),
    });
    setSuccessMsg("");
  };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };
  const handleEditChange = (e) => setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateIncident(editingId, editForm);
    } catch {
      setIncidents((prev) => prev.map((i) => i.id === editingId ? { ...i, ...editForm } : i));
    } finally {
      setSuccessMsg("Incidente actualizado correctamente.");
      setEditingId(null);
      setSaving(false);
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchData();
    }
  };

  /* ── PDF / Print ─────────────────────────────────────────── */
  const printIncident = (inc) => {
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte de Incidente #${inc.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;color:#111;background:#fff;padding:24px}
    .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #C8102E;padding-bottom:14px;margin-bottom:20px}
    .header-left h1{font-size:16pt;font-weight:800;color:#C8102E;letter-spacing:-0.5px}
    .header-left p{font-size:8.5pt;color:#555;margin-top:2px}
    .header-right{text-align:right;font-size:8.5pt;color:#555}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;color:#fff;font-size:8pt;font-weight:700}
    .section{margin-bottom:18px}
    .section-title{font-size:10pt;font-weight:700;color:#C8102E;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:10px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .grid-2{grid-template-columns:repeat(2,1fr)}
    .field{background:#f8f8f8;border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px}
    .field-label{font-size:7.5pt;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
    .field-value{font-size:9.5pt;font-weight:500;color:#111}
    .full{grid-column:1/-1}
    .footer{margin-top:24px;border-top:1px solid #eee;padding-top:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
    .sign-box{text-align:center}
    .sign-line{border-top:1px solid #333;margin-top:36px;padding-top:6px;font-size:8pt;color:#555}
    .watermark{position:fixed;bottom:24px;right:24px;font-size:7pt;color:#ccc}
    @media print{.no-print{display:none}}
  </style>
</head>
<body>
<div class="header">
  <div class="header-left">
    <h1>🚨 Reporte de Incidente de Seguridad</h1>
    <p>Sistema RIS — Nissan Motor de México</p>
  </div>
  <div class="header-right">
    <strong>Folio: INC-${String(inc.id).padStart(4,"0")}</strong><br/>
    Generado: ${new Date().toLocaleString("es-MX")}<br/>
    <span class="badge" style="background:${SEVERITY_COLORS[inc.severity]||'#888'};margin-top:4px">${inc.severity||"—"}</span>
    &nbsp;
    <span class="badge" style="background:${STATUS_COLORS[inc.status]||'#888'}">${inc.status||"—"}</span>
  </div>
</div>

<div class="section">
  <div class="section-title">📍 Identificación del Incidente</div>
  <div class="grid">
    <div class="field"><div class="field-label">Planta</div><div class="field-value">${inc.id_plant||"—"}</div></div>
    <div class="field"><div class="field-label">Área</div><div class="field-value">${inc.id_area||"—"}</div></div>
    <div class="field"><div class="field-label">Turno</div><div class="field-value">${inc.shift||"—"}</div></div>
    <div class="field"><div class="field-label">Fecha</div><div class="field-value">${inc.incident_date||"—"}</div></div>
    <div class="field"><div class="field-label">Hora</div><div class="field-value">${inc.incident_time||"—"}</div></div>
    <div class="field"><div class="field-label">Lugar / Equipo</div><div class="field-value">${inc.location||"—"}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">📋 Descripción del Incidente</div>
  <div class="grid">
    <div class="field"><div class="field-label">Tipo de Incidente</div><div class="field-value">${inc.incident_type||"—"}</div></div>
    <div class="field"><div class="field-label">Causa Inmediata</div><div class="field-value">${inc.immediate_cause||"—"}</div></div>
    <div class="field"><div class="field-label">Parte del Cuerpo</div><div class="field-value">${inc.body_part_affected||"—"}</div></div>
    <div class="field full"><div class="field-label">Descripción Detallada</div><div class="field-value">${inc.description||"—"}</div></div>
    <div class="field full"><div class="field-label">Testigos</div><div class="field-value">${inc.witnesses||"—"}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">🛠️ Respuesta y Seguimiento</div>
  <div class="grid grid-2">
    <div class="field"><div class="field-label">Acciones Inmediatas</div><div class="field-value">${inc.immediate_actions||"—"}</div></div>
    <div class="field"><div class="field-label">Acciones Correctivas / Preventivas</div><div class="field-value">${inc.corrective_actions||"—"}</div></div>
    <div class="field"><div class="field-label">Responsable de Seguimiento</div><div class="field-value">${inc.id_responsible_user||"—"}</div></div>
    <div class="field"><div class="field-label">Fecha Límite de Seguimiento</div><div class="field-value">${inc.follow_up_date||"—"}</div></div>
  </div>
</div>

<div class="footer">
  <div class="sign-box"><div class="sign-line">Reportó</div></div>
  <div class="sign-box"><div class="sign-line">Supervisor / Jefe de Área</div></div>
  <div class="sign-box"><div class="sign-line">Seguridad Industrial</div></div>
</div>

<div class="watermark">RIS v1.0 — Nissan Motor de México</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`);
    win.document.close();
  };

  /* ── Create-new shortcut → redirect ─────────────────────── */
  const goToForm = () => window.location.href = "/reporteIncidente";

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div className="admin-page">
      <div className="admin-container">

        {/* Header */}
        <div className="ai-header animate-in">
          <div>
            <h1>Administración de Incidentes</h1>
            <p className="ai-subtitle">Gestiona, investiga y da seguimiento a todos los incidentes registrados.</p>
          </div>
          <button id="ai-btn-new" className="ai-btn-new" onClick={goToForm}>
            + Nuevo Reporte
          </button>
        </div>

        {/* Success */}
        {successMsg && <div className="admin-success animate-in">{successMsg}</div>}

        {/* Filters */}
        <div className="admin-filters animate-in animate-in-delay-1">
          <div className="filter-group">
            <label htmlFor="ai-search">Buscar</label>
            <input id="ai-search" type="text" placeholder="ID, área, descripción…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-group">
            <label htmlFor="ai-filter-type">Tipo</label>
            <select id="ai-filter-type" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="ai-filter-sev">Gravedad</label>
            <select id="ai-filter-sev" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
              {SEVERITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="ai-filter-status">Estatus</label>
            <select id="ai-filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="filter-group filter-count">
            <span className="count-badge">{filtered.length}</span>
            <span>resultados</span>
          </div>
        </div>

        {/* Loading */}
        {loading && <div className="admin-loading">Cargando incidentes…</div>}

        {/* Table */}
        {!loading && (
          <div className="admin-table-wrapper animate-in animate-in-delay-2">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Planta / Área</th>
                  <th>Tipo</th>
                  <th>Gravedad</th>
                  <th>Descripción</th>
                  <th>Estatus</th>
                  <th>Responsable</th>
                  <th>Seguimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="10" className="admin-empty">No se encontraron incidentes</td></tr>
                ) : filtered.map((inc) => (
                  <React.Fragment key={inc.id}>
                    <tr className={editingId === inc.id ? "row-editing" : ""}>
                      <td className="cell-id">INC-{String(inc.id).padStart(4, "0")}</td>
                      <td>{fmtDate(inc.incident_date)}<br /><small className="ai-time">{inc.incident_time}</small></td>
                      <td>
                        <span className="ai-plant">{inc.id_plant?.split("–")[0]?.trim()}</span><br />
                        <small>{inc.id_area}</small>
                      </td>
                      <td><span className="category-badge">{inc.incident_type}</span></td>
                      <td>
                        <span className="status-badge" style={{ background: SEVERITY_COLORS[inc.severity] || "#888" }}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="cell-desc">{inc.description}</td>
                      <td>
                        <span className="status-badge" style={{ background: STATUS_COLORS[inc.status] || "#888" }}>
                          {inc.status}
                        </span>
                      </td>
                      <td>{inc.id_responsible_user || "—"}</td>
                      <td>{fmtDate(inc.follow_up_date)}</td>
                      <td>
                        <div className="ai-action-btns">
                          <button className="btn-edit" onClick={() => setDetailId(inc.id)} title="Ver detalle">👁️</button>
                          <button className="btn-edit" onClick={() => startEdit(inc)} title="Editar">✏️</button>
                          <button className="btn-edit ai-btn-print" onClick={() => printIncident(inc)} title="Generar formato">🖨️</button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit */}
                    {editingId === inc.id && (
                      <tr className="edit-row">
                        <td colSpan="10">
                          <div className="edit-form">
                            <h3>Editar Incidente INC-{String(inc.id).padStart(4, "0")}</h3>
                            <div className="edit-grid">
                              <label>Tipo de Incidente
                                <select name="incident_type" value={editForm.incident_type} onChange={handleEditChange}>
                                  {TIPO_OPTIONS.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              </label>
                              <label>Gravedad
                                <select name="severity" value={editForm.severity} onChange={handleEditChange}>
                                  {SEVERITY_OPTIONS.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              </label>
                              <label>Estatus
                                <select name="status" value={editForm.status} onChange={handleEditChange}>
                                  {STATUS_OPTIONS.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              </label>
                              <label>Responsable
                                <input name="id_responsible_user" value={editForm.id_responsible_user} onChange={handleEditChange} />
                              </label>
                              <label>Fecha Límite Seguimiento
                                <input type="date" name="follow_up_date" value={editForm.follow_up_date} onChange={handleEditChange} />
                              </label>
                              <label className="full-width">Descripción
                                <textarea name="description" value={editForm.description} onChange={handleEditChange} rows={2} />
                              </label>
                              <label className="full-width">Acciones Inmediatas
                                <textarea name="immediate_actions" value={editForm.immediate_actions} onChange={handleEditChange} rows={2} />
                              </label>
                              <label className="full-width">Acciones Correctivas / Preventivas
                                <textarea name="corrective_actions" value={editForm.corrective_actions} onChange={handleEditChange} rows={2} />
                              </label>
                            </div>
                            <div className="edit-actions">
                              <button className="btn-save" onClick={saveEdit} disabled={saving}>
                                {saving ? "Guardando…" : "💾 Guardar"}
                              </button>
                              <button className="btn-cancel" onClick={cancelEdit}>Cancelar</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Modal ─────────────────────────────────────── */}
      {detailItem && (
        <div className="popup" onClick={() => setDetailId(null)}>
          <div className="ai-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-detail-header">
              <div>
                <h2>INC-{String(detailItem.id).padStart(4, "0")}</h2>
                <p>{detailItem.incident_type}</p>
              </div>
              <div className="ai-detail-badges">
                <span className="status-badge" style={{ background: SEVERITY_COLORS[detailItem.severity] || "#888" }}>
                  {detailItem.severity}
                </span>
                <span className="status-badge" style={{ background: STATUS_COLORS[detailItem.status] || "#888" }}>
                  {detailItem.status}
                </span>
              </div>
            </div>

            <div className="ai-detail-grid">
              {[
                ["Planta", detailItem.id_plant],
                ["Área", detailItem.id_area],
                ["Turno", detailItem.shift],
                ["Fecha", fmtDate(detailItem.incident_date)],
                ["Hora", detailItem.incident_time],
                ["Lugar / Equipo", detailItem.location],
                ["Causa inmediata", detailItem.immediate_cause],
                ["Parte del cuerpo", detailItem.body_part_affected],
                ["Testigos", detailItem.witnesses || "—"],
                ["Responsable", detailItem.id_responsible_user || "—"],
                ["Fecha seguimiento", fmtDate(detailItem.follow_up_date)],
              ].map(([label, value]) => (
                <div key={label} className="ai-detail-field">
                  <span className="ai-detail-label">{label}</span>
                  <span className="ai-detail-value">{value || "—"}</span>
                </div>
              ))}
              <div className="ai-detail-field ai-detail-full">
                <span className="ai-detail-label">Descripción</span>
                <span className="ai-detail-value">{detailItem.description}</span>
              </div>
              <div className="ai-detail-field ai-detail-full">
                <span className="ai-detail-label">Acciones inmediatas</span>
                <span className="ai-detail-value">{detailItem.immediate_actions || "—"}</span>
              </div>
              <div className="ai-detail-field ai-detail-full">
                <span className="ai-detail-label">Acciones correctivas</span>
                <span className="ai-detail-value">{detailItem.corrective_actions || "—"}</span>
              </div>
            </div>

            <div className="ai-detail-footer">
              <button className="btn-edit ai-btn-print" onClick={() => printIncident(detailItem)}>
                🖨️ Generar Formato
              </button>
              <button className="btn-cancel" onClick={() => setDetailId(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIncidentes;
