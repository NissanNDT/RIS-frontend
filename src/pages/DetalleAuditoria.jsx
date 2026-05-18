import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getAuditById, 
  updateAudit 
} from "../services/auditService";
import { 
  getPlants, 
  getAreas, 
  createFinding, 
  updateFinding,
  getFindingsByAuditId
} from "../services/findingService";
import "../styles/Auditorias.css";

const DEMO_AUDITS = [
  {
    id: 1,
    name: "Auditoría de Seguridad Trimestral - Planta A1",
    audit_folio: "SES-1-ENSAMBLE-001",
    id_plant: 1,
    id_area: 101,
    type: "SES",
    created_at: new Date().toISOString(),
    id_audit_user: 10
  }
];

const DEMO_FINDINGS = [
  {
    id: 1,
    description: "Extintor con carga vencida en pasillo principal.",
    location: "Pasillo A3",
    finding_category: "Condición Insegura",
    status: "Abierto",
    id_audit: 1
  }
];

const DetalleAuditoria = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [audit, setAudit] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState([]);
  const [areas, setAreas] = useState([]);
  
  // Modals
  const [showAddFindingModal, setShowAddFindingModal] = useState(false);
  const [showEditAuditModal, setShowEditAuditModal] = useState(false);
  const [showEditFindingModal, setShowEditFindingModal] = useState(false);

  // Forms
  const [auditForm, setAuditForm] = useState({});
  const [findingForm, setFindingForm] = useState({
    description: "",
    location: "",
    finding_category: "Acto Inseguro",
    level: "A"
  });
  const [editFindingForm, setEditFindingForm] = useState({});
  const [selectedFindingId, setSelectedFindingId] = useState(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditData, findingsData, plantsData, areasData] = await Promise.all([
        getAuditById(id),
        getFindingsByAuditId(id),
        getPlants(),
        getAreas()
      ]);
      
      const currentAudit = auditData || DEMO_AUDITS.find(a => String(a.id) === String(id));
      setAudit(currentAudit);
      setFindings(findingsData.length > 0 ? findingsData : DEMO_FINDINGS.filter(f => String(f.id_audit) === String(id)));
      setPlants(plantsData);
      setAreas(areasData);
      
      // Init edit form
      if (currentAudit) {
        setAuditForm({
          name: currentAudit.name,
          id_plant: currentAudit.id_plant,
          id_area: currentAudit.id_area,
          type: currentAudit.type
        });
      }
    } catch (err) {
      console.error("Error fetching audit details:", err);
      const demoA = DEMO_AUDITS.find(a => String(a.id) === String(id));
      if (demoA) {
        setAudit(demoA);
        setAuditForm({ name: demoA.name, id_plant: demoA.id_plant, id_area: demoA.id_area, type: demoA.type });
        setFindings(DEMO_FINDINGS.filter(f => String(f.id_audit) === String(id)));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAudit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...auditForm,
        id_plant: Number(auditForm.id_plant),
        id_area: Number(auditForm.id_area)
      };
      await updateAudit(id, payload);
      setShowEditAuditModal(false);
      fetchData();
      alert("Auditoría actualizada");
    } catch (err) {
      console.error("Error updating audit:", err);
      alert(err.response?.data?.error || "Error al actualizar la auditoría");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFinding = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...findingForm,
        id_audit: id,
        id_plant: audit.id_plant,
        id_area: audit.id_area
      };
      await createFinding(payload);
      setShowAddFindingModal(false);
      setFindingForm({ description: "", location: "", finding_category: "Acto Inseguro", level: "A" });
      const updatedFindings = await getFindingsByAuditId(id);
      setFindings(updatedFindings);
    } catch (err) {
      console.error("Error creating finding:", err);
      alert("Error al crear el hallazgo");
    } finally {
      setSaving(false);
    }
  };

  const openEditFinding = (finding) => {
    setSelectedFindingId(finding.id);
    setEditFindingForm({
      description: finding.description,
      location: finding.location,
      finding_category: finding.finding_category,
      status: finding.status,
      level: finding.level || "A"
    });
    setShowEditFindingModal(true);
  };

  const handleUpdateFinding = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateFinding(selectedFindingId, editFindingForm);
      setShowEditFindingModal(false);
      const updatedFindings = await getFindingsByAuditId(id);
      setFindings(updatedFindings);
      alert("Hallazgo actualizado");
    } catch (err) {
      console.error("Error updating finding:", err);
      alert("Error al actualizar el hallazgo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="auditorias-page"><div className="empty-state">Cargando detalles...</div></div>;
  if (!audit) return <div className="auditorias-page"><div className="empty-state">No se encontró la auditoría.</div></div>;

  const plantName = plants.find(p => p.id === audit.id_plant)?.name || audit.id_plant;
  const areaName = areas.find(a => a.id === audit.id_area)?.name || audit.id_area;

  return (
    <div className="auditorias-page">
      <div className="auditorias-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button className="btn-view" onClick={() => navigate("/auditorias")}>
            ⬅️ Volver a Auditorías
          </button>
          <button className="btn-action btn-view" onClick={() => setShowEditAuditModal(true)}>
            ✏️ Editar Auditoría
          </button>
        </div>

        <div className="audit-detail-header animate-in glass" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className={`audit-type-badge type-${audit.type.toLowerCase()}`} style={{ position: 'static', marginBottom: '0.5rem', display: 'inline-block' }}>
                {audit.type}
              </span>
              <h1 style={{ margin: '0.5rem 0' }}>{audit.name}</h1>
              <p className="audit-folio" style={{ fontSize: '1.1rem' }}>{audit.audit_folio}</p>
            </div>
            <button className="btn-new-audit" onClick={() => setShowAddFindingModal(true)}>
              + Agregar Hallazgo
            </button>
          </div>

          <div className="audit-info" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <div className="info-item">📍 Planta: <span>{plantName}</span></div>
            <div className="info-item">🧱 Área: <span>{areaName}</span></div>
            <div className="info-item">📅 Fecha: <span>{new Date(audit.created_at).toLocaleDateString()}</span></div>
            <div className="info-item">👤 Responsable ID: <span>{audit.id_audit_user}</span></div>
          </div>
        </div>

        <h2 className="animate-in animate-in-delay-1" style={{ marginBottom: '1.5rem' }}>Hallazgos Registrados ({findings.length})</h2>

        {findings.length === 0 ? (
          <div className="empty-state animate-in animate-in-delay-2 glass" style={{ borderRadius: '16px' }}>
            No hay hallazgos registrados para esta auditoría todavía.
          </div>
        ) : (
          <div className="findings-list animate-in animate-in-delay-2">
            {findings.map(f => (
              <div key={f.id} className="finding-item glass" style={{ padding: '1.5rem', borderLeft: '6px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div className="finding-desc" style={{ fontSize: '1.1rem' }}>{f.description}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="status-badge" style={{ background: f.status === 'Abierto' ? 'var(--primary)' : '#43A047' }}>{f.status}</span>
                    <button className="btn-view" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => openEditFinding(f)}>✏️</button>
                  </div>
                </div>
                <div className="finding-meta">
                  <span>📍 <strong>Ubicación:</strong> {f.location}</span>
                  <span>🏷️ <strong>Categoría:</strong> {f.finding_category}</span>
                  <span>📊 <strong>Nivel:</strong> {f.level || "—"}</span>
                  <span>📅 <strong>ID:</strong> {f.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Audit Modal */}
      {showEditAuditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Editar Auditoría</h2>
              <button className="btn-close" onClick={() => setShowEditAuditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateAudit}>
              <div className="modal-body">
                <div className="audit-form-grid">
                  <div className="form-group full">
                    <label>Nombre de la Auditoría</label>
                    <input 
                      type="text" 
                      value={auditForm.name} 
                      onChange={(e) => setAuditForm({...auditForm, name: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Planta</label>
                    <select value={auditForm.id_plant} onChange={(e) => setAuditForm({...auditForm, id_plant: e.target.value})} required>
                      {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Área</label>
                    <select value={auditForm.id_area} onChange={(e) => setAuditForm({...auditForm, id_area: e.target.value})} required>
                      {areas.filter(a => String(a.id_plant) === String(auditForm.id_plant)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipo</label>
                    <select value={auditForm.type} onChange={(e) => setAuditForm({...auditForm, type: e.target.value})} required>
                      <option value="SES">SES</option>
                      <option value="FPES">FPES</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowEditAuditModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : "Actualizar Auditoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Finding Modal */}
      {showEditFindingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Editar Hallazgo</h2>
              <button className="btn-close" onClick={() => setShowEditFindingModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateFinding}>
              <div className="modal-body">
                <div className="audit-form-grid">
                  <div className="form-group full">
                    <label>Descripción del Hallazgo</label>
                    <textarea 
                      value={editFindingForm.description} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, description: e.target.value})} 
                      required 
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ubicación / Equipo</label>
                    <input 
                      type="text" 
                      value={editFindingForm.location} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, location: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select 
                      value={editFindingForm.finding_category} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, finding_category: e.target.value})} 
                      required
                    >
                      <option value="Acto Inseguro">Acto Inseguro</option>
                      <option value="Condición Insegura">Condición Insegura</option>
                      <option value="Condición NG">Condición NG</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nivel</label>
                    <select 
                      value={editFindingForm.level} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, level: e.target.value})} 
                      required
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estatus</label>
                    <select 
                      value={editFindingForm.status} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, status: e.target.value})} 
                      required
                    >
                      <option value="Abierto">Abierto</option>
                      <option value="En revisión">En revisión</option>
                      <option value="Cerrado">Cerrado</option>
                      <option value="Rechazado">Rechazado</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowEditFindingModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : "Actualizar Hallazgo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Finding Modal */}
      {showAddFindingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nuevo Hallazgo</h2>
              <button className="btn-close" onClick={() => setShowAddFindingModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateFinding}>
              <div className="modal-body">
                <div className="audit-form-grid">
                  <div className="form-group full">
                    <label>Descripción del Hallazgo</label>
                    <textarea 
                      name="description" 
                      value={findingForm.description} 
                      onChange={(e) => setFindingForm(p => ({...p, description: e.target.value}))} 
                      placeholder="Describe lo encontrado..."
                      required 
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ubicación / Equipo</label>
                    <input 
                      type="text" 
                      name="location" 
                      value={findingForm.location} 
                      onChange={(e) => setFindingForm(p => ({...p, location: e.target.value}))} 
                      placeholder="Ej. Línea de ensamble"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select 
                      name="finding_category" 
                      value={findingForm.finding_category} 
                      onChange={(e) => setFindingForm(p => ({...p, finding_category: e.target.value}))} 
                      required
                    >
                      <option value="Acto Inseguro">Acto Inseguro</option>
                      <option value="Condición Insegura">Condición Insegura</option>
                      <option value="Condición NG">Condición NG</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nivel</label>
                    <select 
                      name="level" 
                      value={findingForm.level} 
                      onChange={(e) => setFindingForm(p => ({...p, level: e.target.value}))} 
                      required
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowAddFindingModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Hallazgo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleAuditoria;
