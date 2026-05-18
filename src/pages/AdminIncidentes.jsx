import React, { useState, useEffect, useMemo, useRef } from "react";
import { getAllIncidents, updateIncident } from "../services/incidentService";
import "../App.css";
import "../styles/AdminIncidentes.css";

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


/* ── Helpers ───────────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtDateInput = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");

/* ════════════════════════════════════════════════════════════ */
const AdminIncidentes = () => {
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

  /* fetch */
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllIncidents();
      setIncidents(Array.isArray(data) ? data : data.data || []);
    } catch {
      setError("Error al cargar incidentes.");
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
  const detailItem = incidents.find((i) => (i.id || i.incident_folio) === detailId) || null;

  /* edit */
  const startEdit = (inc) => {
    setEditingId(inc.id || inc.incident_folio);
    setEditForm({
      level: inc.level || "",
      description: inc.description || "",
      root_cause: inc.root_cause || "",
      id_responsible_user: inc.id_responsible_user || "",
      id_general_sv: inc.id_general_sv || "",
      id_junior: inc.id_junior || "",
      incident_mechanism: inc.incident_mechanism || "",
      injury: inc.injury || "",
      id_cost_center: inc.id_cost_center || "",
    });
    setSuccessMsg("");
  };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };
  const handleEditChange = (e) => setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateIncident(editingId, editForm);
      setSuccessMsg("Incidente actualizado correctamente.");
      setEditingId(null);
      fetchData();
    } catch {
      setSuccessMsg("Error al actualizar incidente.");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(""), 3000);
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

  const goToForm = () => window.location.href = "/reporteIncidente";

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

        {loading && <div className="admin-loading">Cargando incidentes…</div>}

        {!loading && (
          <div className="admin-table-wrapper animate-in animate-in-delay-2">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha y Hora</th>
                  <th>Planta / Área</th>
                  <th>Nivel</th>
                  <th>Ubicación</th>
                  <th>Involucrados</th>
                  <th>Mecanismo / Lesión</th>
                  <th>Descripción / Causa Raíz</th>
                  <th>C. Costo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="10" className="admin-empty">No se encontraron incidentes</td></tr>
                ) : filtered.map((inc) => (
                  <tr key={inc.id || inc.incident_folio} className={editingId === (inc.id || inc.incident_folio) ? "row-editing" : ""}>
                    <td className="cell-id">{inc.incident_folio || "—"}</td>
                    <td>{fmtDate(inc.date)}<br /><small className="ai-time">{inc.time}</small></td>
                    <td>
                      <span className="ai-plant">{inc.id_plant || "—"}</span><br />
                      <small>{inc.id_area || "—"}</small>
                    </td>
                    <td>
                      <span className="status-badge" style={{ background: SEVERITY_COLORS[inc.level] || "#888" }}>
                        {inc.level || "—"}
                      </span>
                    </td>
                    <td>{inc.location || "—"}</td>
                    <td>
                      <small><strong>Resp:</strong> {inc.id_responsible_user || "—"}</small><br/>
                      <small><strong>SV:</strong> {inc.id_general_sv || "—"}</small><br/>
                      <small><strong>Jr:</strong> {inc.id_junior || "—"}</small>
                    </td>
                    <td>
                      <small><strong>Mec:</strong> {inc.incident_mechanism || "—"}</small><br/>
                      <small><strong>Les:</strong> {inc.injury || "—"}</small>
                    </td>
                    <td className="cell-desc">
                      <div style={{ maxHeight: '60px', overflowY: 'auto' }}>
                        <small><strong>Desc:</strong> {inc.description || "—"}</small><br/>
                        <small><strong>Causa:</strong> {inc.root_cause || "—"}</small>
                      </div>
                    </td>
                    <td>{inc.id_cost_center || "—"}</td>
                    <td>
                      <div className="ai-action-btns">
                        <button className="btn-edit" onClick={() => setDetailId(inc.id || inc.incident_folio)} title="Ver detalle">👁️</button>
                        <button className="btn-edit" onClick={() => startEdit(inc)} title="Editar">✏️</button>
                        <button className="btn-edit ai-btn-print" onClick={() => printIncident(inc)} title="Generar formato">🖨️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <div className="popup" onClick={() => setDetailId(null)}>
          <div className="ai-detail-modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="ai-detail-header">
              <div>
                <h2>{detailItem.incident_folio || `INC-${String(detailItem.id).padStart(4, "0")}`}</h2>
                <p>{detailItem.location}</p>
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
                ["Fecha", fmtDate(detailItem.date)],
                ["Hora", detailItem.time],
                ["Ubicación", detailItem.location],
                ["Mecanismo", detailItem.incident_mechanism],
                ["Lesión", detailItem.injury],
                ["Responsable", detailItem.id_responsible_user || "—"],
                ["SV General", detailItem.id_general_sv || "—"],
                ["Junior", detailItem.id_junior || "—"],
                ["Centro de Costo", detailItem.id_cost_center || "—"],
              ].map(([label, value]) => (
                <div key={label} className="ai-detail-field">
                  <span className="ai-detail-label">{label}</span>
                  <span className="ai-detail-value">{value || "—"}</span>
                </div>
              ))}
              <div className="ai-detail-field ai-detail-full">
                <span className="ai-detail-label">Descripción</span>
                <span className="ai-detail-value">{detailItem.description || "—"}</span>
              </div>
              <div className="ai-detail-field ai-detail-full">
                <span className="ai-detail-label">Causa Raíz</span>
                <span className="ai-detail-value">{detailItem.root_cause || "—"}</span>
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

      {/* Edit Modal */}
      {editingId && (
        <div className="popup" onClick={cancelEdit}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Editar Incidente INC-{String(editingId).padStart(4, "0")}</h2>
              <button className="btn-close" onClick={cancelEdit}>&times;</button>
            </div>
            <form onSubmit={saveEdit}>
              <div className="modal-body">
                <div className="audit-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Tipo de Incidente</label>
                    <select name="incident_type" value={editForm.incident_type} onChange={handleEditChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                      {TIPO_OPTIONS.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Gravedad</label>
                    <select name="severity" value={editForm.severity} onChange={handleEditChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                      {SEVERITY_OPTIONS.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estatus</label>
                    <select name="status" value={editForm.status} onChange={handleEditChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                      {STATUS_OPTIONS.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Responsable</label>
                    <input name="id_responsible_user" value={editForm.id_responsible_user} onChange={handleEditChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }} />
                  </div>
                  <div className="form-group">
                    <label>Fecha Límite Seguimiento</label>
                    <input type="date" name="follow_up_date" value={editForm.follow_up_date} onChange={handleEditChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción</label>
                    <textarea name="description" value={editForm.description} onChange={handleEditChange} rows={2} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Acciones Inmediatas</label>
                    <textarea name="immediate_actions" value={editForm.immediate_actions} onChange={handleEditChange} rows={2} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Acciones Correctivas / Preventivas</label>
                    <textarea name="corrective_actions" value={editForm.corrective_actions} onChange={handleEditChange} rows={2} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" className="btn-cancel" onClick={cancelEdit}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : "💾 Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIncidentes;
