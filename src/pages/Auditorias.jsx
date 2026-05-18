import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getAllAudits, 
  createAudit,
  updateAudit
} from "../services/auditService";
import { getPlants, getAreas } from "../services/findingService";
import "../styles/Auditorias.css";



const Auditorias = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState([]);
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState("");

  // Filter states
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPlant, setFilterPlant] = useState("");
  const [filterArea, setFilterArea] = useState("");

  // Modal states
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [auditForm, setAuditForm] = useState({
    name: "",
    id_plant: "",
    id_area: "",
    type: "SES"
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditsData, plantsData, areasData] = await Promise.all([
        getAllAudits(),
        getPlants(),
        getAreas()
      ]);
      setAudits(auditsData || []);
      setPlants(plantsData || []);
      setAreas(areasData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setAudits([]);
      setError("Error al cargar las auditorías.");
    } finally {
      setLoading(false);
    }
  };

  const filteredAudits = useMemo(() => {
    return audits.filter(a => {
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.audit_folio.toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || a.type === filterType;
      const matchPlant = !filterPlant || String(a.id_plant) === String(filterPlant);
      const matchArea = !filterArea || String(a.id_area) === String(filterArea);
      return matchSearch && matchType && matchPlant && matchArea;
    });
  }, [audits, search, filterType, filterPlant, filterArea]);

  const handleAuditChange = (e) => {
    const { name, value } = e.target;
    setAuditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAudit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Ensure numeric values for IDs
      const payload = {
        ...auditForm,
        id_plant: Number(auditForm.id_plant),
        id_area: Number(auditForm.id_area)
      };
      
      console.log("Enviando petición de creación:", payload);
      const result = await createAudit(payload);
      console.log("Tipo de result", typeof(result));
      console.log("Json",payload)
      console.log("Resultado de creación:", result);

      setShowNewAuditModal(false);
      setAuditForm({ name: "", id_plant: "", id_area: "", type: "SES" });
      
      // Redirect to the new audit detail page
      if (result && (result.id || result.id_audit)) {
        const newId = result.id || result.id_audit;
        navigate(`/auditorias/${newId}`);
      } else {
        fetchData();
      }
    } catch (err) {
      console.error("Error creating audit:", err);
      const errorMessage = err.response?.data?.error || err.message || "Error desconocido";
      alert(`Error al crear la auditoría: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (audit) => {
    setIsEditing(true);
    setEditingId(audit.id);
    setAuditForm({
      name: audit.name || "",
      id_plant: audit.id_plant || "",
      id_area: audit.id_area || "",
      type: audit.type || "SES"
    });
    setShowNewAuditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...auditForm,
        id_plant: Number(auditForm.id_plant),
        id_area: Number(auditForm.id_area)
      };
      
      await updateAudit(editingId, payload);
      
      setShowNewAuditModal(false);
      setIsEditing(false);
      setEditingId(null);
      setAuditForm({ name: "", id_plant: "", id_area: "", type: "SES" });
      
      fetchData();
    } catch (err) {
      console.error("Error updating audit:", err);
      const errorMessage = err.response?.data?.error || err.message || "Error desconocido";
      alert(`Error al actualizar la auditoría: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auditorias-page">
      <div className="auditorias-container">
        <div className="auditorias-header animate-in">
          <h1>Auditorías</h1>
          <button className="btn-new-audit" onClick={() => {
            setIsEditing(false);
            setEditingId(null);
            setAuditForm({ name: "", id_plant: "", id_area: "", type: "SES" });
            setShowNewAuditModal(true);
          }}>
            + Nueva Auditoría
          </button>
        </div>

        {/* Filters Bar */}
        <div className="auditorias-filters animate-in animate-in-delay-1">
          <div className="filter-item">
            <label>Buscar</label>
            <input 
              type="text" 
              placeholder="Nombre o folio..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div className="filter-item">
            <label>Tipo</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Todos</option>
              <option value="SES">SES</option>
              <option value="FPES">FPES</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Planta</label>
            <select value={filterPlant} onChange={(e) => setFilterPlant(e.target.value)}>
              <option value="">Todas</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Área</label>
            <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
              <option value="">Todas</option>
              {areas
                .filter(a => !filterPlant || !a.id_plant || String(a.id_plant) === String(filterPlant))
                .map(a => <option key={a.id} value={a.id}>{a.nombre || a.name}</option>)
              }
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Cargando auditorías...</div>
        ) : filteredAudits.length === 0 ? (
          <div className="empty-state">No se encontraron auditorías con los filtros aplicados.</div>
        ) : (
          <div className="audits-grid animate-in animate-in-delay-2">
            {filteredAudits.map((audit) => (
              <div key={audit.id} className="audit-card" onClick={() => navigate(`/auditorias/${audit.id}`)}>
                <div className={`audit-type-badge type-${audit.type.toLowerCase()}`}>
                  {audit.type}
                </div>
                <div className="audit-folio">{audit.audit_folio}</div>
                <div className="audit-name">{audit.name}</div>
                
                <div className="audit-info">
                  <div className="info-item">
                    📍 Planta: <span>{plants.find(p => p.id === audit.id_plant)?.name || audit.id_plant}</span>
                  </div>
                  <div className="info-item">
                    🧱 Área: <span>{areas.find(a => a.id === audit.id_area)?.nombre || areas.find(a => a.id === audit.id_area)?.name || audit.id_area}</span>
                  </div>
                  <div className="info-item">
                    📅 Creado: <span>{new Date(audit.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="audit-actions">
                  <button className="btn-action btn-view" onClick={(e) => { e.stopPropagation(); navigate(`/auditorias/${audit.id}`); }}>
                    👁️ Ver Detalle
                  </button>
                  <button className="btn-action btn-view" onClick={(e) => { e.stopPropagation(); handleEdit(audit); }}>
                    ✏️ Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Audit Modal */}
      {showNewAuditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{isEditing ? "Editar Auditoría" : "Nueva Auditoría"}</h2>
              <button className="btn-close" onClick={() => setShowNewAuditModal(false)}>&times;</button>
            </div>
            <form onSubmit={isEditing ? handleUpdate : handleCreateAudit}>
              <div className="modal-body">
                <div className="audit-form-grid">
                  <div className="form-group full">
                    <label>Nombre de la Auditoría</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={auditForm.name} 
                      onChange={handleAuditChange} 
                      placeholder="Ej. Auditoría de Seguridad Trimestral"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Planta</label>
                    <select name="id_plant" value={auditForm.id_plant} onChange={handleAuditChange} required>
                      <option value="">Selecciona Planta</option>
                      {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Área</label>
                    <select name="id_area" value={auditForm.id_area} onChange={handleAuditChange} required>
                      <option value="">Selecciona Área</option>
                      {areas
                        .filter(a => !auditForm.id_plant || !a.id_plant || String(a.id_plant) === String(auditForm.id_plant))
                        .map(a => <option key={a.id} value={a.id}>{a.nombre || a.name}</option>)
                      }
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipo</label>
                    <select name="type" value={auditForm.type} onChange={handleAuditChange} required>
                      <option value="SES">SES</option>
                      <option value="FPES">FPES</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowNewAuditModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : isEditing ? "Actualizar Auditoría" : "Crear Auditoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auditorias;
