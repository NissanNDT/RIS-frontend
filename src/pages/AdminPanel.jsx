import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAreas, createArea, updateArea, deleteArea,
  getPlants, createPlant, updatePlant, deletePlant,
  getUsers, createUser, updateUser, deleteUser,
  getSvByArea, createSvByArea, updateSvByArea, deleteSvByArea,
  getRoles,
} from "../services/adminService";
import "../App.css";

// ─── Tabs ──────────────────────────────────────────────────────────────────
const TABS = [
  { key: "areas",    label: "Áreas" },
  { key: "plants",   label: "Plantas" },
  { key: "users",    label: "Usuarios" },
  { key: "svByArea", label: "SV por Área" },
];

const EMPTY_AREA    = { name: "" };
const EMPTY_PLANT   = { name: "" };
const EMPTY_USER    = { full_name: "", email: "", password: "", id_plant: "", id_role: "" };
const EMPTY_SV      = { id_plant: "", id_area: "", id_user: "" };

// ─── Componente principal ──────────────────────────────────────────────────
const AdminPanel = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role !== "Admin") navigate("/", { replace: true });
  }, [role, navigate]);

  const [activeTab, setActiveTab] = useState("areas");
  const [areas,   setAreas]   = useState([]);
  const [plants,  setPlants]  = useState([]);
  const [users,   setUsers]   = useState([]);
  const [svList,  setSvList]  = useState([]);
  const [roles,   setRoles]   = useState([]);

  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState(null);
  const [modal,    setModal]    = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [formErr,  setFormErr]  = useState({});

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (type, msg) => setToast({ type, msg });

  // Carga de datos
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p, u, sv, r] = await Promise.all([
        getAreas(), getPlants(), getUsers(), getSvByArea(), getRoles(),
      ]);
      setAreas(Array.isArray(a) ? a : []);
      setPlants(Array.isArray(p) ? p : []);
      setUsers(Array.isArray(u) ? u : []);
      setSvList(Array.isArray(sv) ? sv : []);
      setRoles(Array.isArray(r) ? r : []);
    } catch {
      showToast("error", "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "Admin") loadAll();
  }, [role, loadAll]);

  // Helpers de nombre
  const plantName = (id) => plants.find((p) => String(p.id) === String(id))?.name || `Planta ${id}`;
  const areaName  = (id) => {
    const a = areas.find((a) => String(a.id) === String(id));
    return a ? (a.nombre ?? a.name) : `Área ${id}`;
  };
  const userName  = (id) => users.find((u) => String(u.id) === String(id))?.full_name || `Usuario ${id}`;
  const roleName  = (id) => roles.find((r) => String(r.id) === String(id))?.name || `Rol ${id}`;

  // Validación
  const validate = (tab, data, isEdit) => {
    const err = {};
    if (tab === "areas") {
      if (!data.nombre?.trim()) err.nombre = "El nombre es requerido";
    }
    if (tab === "plants") {
      if (!data.name?.trim()) err.name = "El nombre es requerido";
    }
    if (tab === "users") {
      if (!data.full_name?.trim()) err.full_name = "El nombre completo es requerido";
      if (!data.email?.trim())     err.email     = "El correo es requerido";
      else if (!/\S+@\S+\.\S+/.test(data.email)) err.email = "Correo inválido";
      if (!isEdit && !data.password?.trim()) err.password = "La contraseña es requerida";
      if (!data.id_plant) err.id_plant = "Selecciona una planta";
      if (!data.id_role)  err.id_role  = "Selecciona un rol";
    }
    if (tab === "svByArea") {
      if (!data.id_plant) err.id_plant = "Selecciona una planta";
      if (!data.id_area)  err.id_area  = "Selecciona un área";
      if (!data.id_user)  err.id_user  = "Selecciona un usuario";
    }
    return err;
  };

  // Abrir modal
  const openCreate = () => {
    const defaults = { areas: EMPTY_AREA, plants: EMPTY_PLANT, users: EMPTY_USER, svByArea: EMPTY_SV };
    setFormErr({});
    setModal({ mode: "create", tab: activeTab, data: { ...defaults[activeTab] } });
  };

  const openEdit = (tab, item) => {
    setFormErr({});
    let data;
    if (tab === "areas")    data = { name: item.name };
    if (tab === "plants")   data = { name: item.name };
    if (tab === "users")    data = { full_name: item.full_name, email: item.email, password: "", id_plant: item.id_plant, id_role: item.id_role };
    if (tab === "svByArea") data = { id_plant: item.id_plant, id_area: item.id_area, id_user: item.id_user };
    setModal({ mode: "edit", tab, id: item.id, data });
  };

  // Guardar
  const handleSave = async () => {
    const { mode, tab, id, data } = modal;
    const errors = validate(tab, data, mode === "edit");
    if (Object.keys(errors).length) { setFormErr(errors); return; }

    setLoading(true);
    try {
      if (tab === "areas") {
        mode === "create" ? await createArea(data.name) : await updateArea(id, data.name);
      }
      if (tab === "plants") {
        mode === "create" ? await createPlant(data.name) : await updatePlant(id, data.name);
      }
      if (tab === "users") {
        const payload = {
          full_name: data.full_name,
          email: data.email,
          id_plant: Number(data.id_plant),
          id_role: Number(data.id_role),
        };
        if (data.password?.trim()) payload.password = data.password;
        mode === "create"
          ? await createUser({ ...payload, password: data.password })
          : await updateUser(id, payload);
      }
      if (tab === "svByArea") {
        const payload = {
          id_plant: Number(data.id_plant),
          id_area:  Number(data.id_area),
          id_user:  Number(data.id_user),
        };
        mode === "create" ? await createSvByArea(payload) : await updateSvByArea(id, payload);
      }
      showToast("success", mode === "create" ? "Creado correctamente ✓" : "Actualizado correctamente ✓");
      setModal(null);
      await loadAll();
    } catch (err) {
      const detail = err.response?.data?.detail?.error || err.message || "Error al guardar";
      showToast("error", detail);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar
  const handleDelete = async () => {
    const { tab, id } = confirm;
    setConfirm(null);
    setLoading(true);
    try {
      if (tab === "areas")    await deleteArea(id);
      if (tab === "plants")   await deletePlant(id);
      if (tab === "users")    await deleteUser(id);
      if (tab === "svByArea") await deleteSvByArea(id);
      showToast("success", "Eliminado correctamente ✓");
      await loadAll();
    } catch (err) {
      const detail = err.response?.data?.detail?.error || err.message || "Error al eliminar";
      showToast("error", detail);
    } finally {
      setLoading(false);
    }
  };

  // ─── Tablas ────────────────────────────────────────────────────────────────
  const renderTable = () => {
    if (loading && areas.length === 0 && plants.length === 0) {
      return <div className="admin-loading"><span className="admin-spinner" />Cargando datos...</div>;
    }

    if (activeTab === "areas") return (
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>Nombre del Área</th>
            <th style={{ width: 160 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {areas.length === 0 && (
            <tr><td colSpan={3} className="admin-empty">Sin áreas registradas</td></tr>
          )}
          {areas.map((a) => (
            <tr key={a.id}>
              <td className="cell-id">{a.id}</td>
              <td><strong>{a.name}</strong></td>
              <td>
                <div className="admin-actions">
                  <button className="btn-edit" onClick={() => openEdit("areas", a)}>✏️ Editar</button>
                  <button className="btn-danger" onClick={() => setConfirm({ tab: "areas", id: a.id, name: a.name })}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (activeTab === "plants") return (
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>Nombre de la Planta</th>
            <th style={{ width: 160 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {plants.length === 0 && (
            <tr><td colSpan={3} className="admin-empty">Sin plantas registradas</td></tr>
          )}
          {plants.map((p) => (
            <tr key={p.id}>
              <td className="cell-id">{p.id}</td>
              <td><strong>{p.name}</strong></td>
              <td>
                <div className="admin-actions">
                  <button className="btn-edit" onClick={() => openEdit("plants", p)}>✏️ Editar</button>
                  <button className="btn-danger" onClick={() => setConfirm({ tab: "plants", id: p.id, name: p.name })}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (activeTab === "users") return (
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>Nombre Completo</th>
            <th>Correo</th>
            <th>Planta</th>
            <th>Rol</th>
            <th style={{ width: 160 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr><td colSpan={6} className="admin-empty">Sin usuarios registrados</td></tr>
          )}
          {users.map((u) => (
            <tr key={u.id}>
              <td className="cell-id">{u.id}</td>
              <td><strong>{u.full_name}</strong></td>
              <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{u.email}</td>
              <td>
                <span className="category-badge">{plantName(u.id_plant)}</span>
              </td>
              <td>
                <span
                  className="status-badge"
                  style={{
                    background: roleName(u.id_role) === "Admin" ? "var(--primary)" : "var(--bg-elevated)",
                    color:      roleName(u.id_role) === "Admin" ? "#fff"           : "var(--text-secondary)",
                    border:     roleName(u.id_role) !== "Admin" ? "1px solid var(--border-default)" : "none",
                  }}
                >
                  {roleName(u.id_role)}
                </span>
              </td>
              <td>
                <div className="admin-actions">
                  <button className="btn-edit" onClick={() => openEdit("users", u)}>✏️ Editar</button>
                  <button className="btn-danger" onClick={() => setConfirm({ tab: "users", id: u.id, name: u.full_name })}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (activeTab === "svByArea") return (
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>Planta</th>
            <th>Área</th>
            <th>Supervisor (SV)</th>
            <th style={{ width: 160 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {svList.length === 0 && (
            <tr><td colSpan={5} className="admin-empty">Sin asignaciones registradas</td></tr>
          )}
          {svList.map((sv) => (
            <tr key={sv.id}>
              <td className="cell-id">{sv.id}</td>
              <td><span className="category-badge">{plantName(sv.id_plant)}</span></td>
              <td><strong>{areaName(sv.id_area)}</strong></td>
              <td>{userName(sv.id_user)}</td>
              <td>
                <div className="admin-actions">
                  <button className="btn-edit" onClick={() => openEdit("svByArea", sv)}>✏️ Editar</button>
                  <button className="btn-danger" onClick={() => setConfirm({ tab: "svByArea", id: sv.id, name: `SV #${sv.id}` })}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // ─── Formulario del modal ──────────────────────────────────────────────────
  const renderForm = () => {
    if (!modal) return null;
    const { tab, data } = modal;
    const set = (field, value) => setModal((m) => ({ ...m, data: { ...m.data, [field]: value } }));
    const err = formErr;

    if (tab === "areas") return (
      <div className="modal-form-group">
        <label className="modal-label">
          Nombre del Área <span className="modal-required">*</span>
        </label>
        <input
          className={`modal-input${err.name ? " modal-input-error" : ""}`}
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ej. Producción"
          autoFocus
        />
        {err.name && <span className="modal-field-error">{err.name}</span>}
      </div>
    );

    if (tab === "plants") return (
      <div className="modal-form-group">
        <label className="modal-label">
          Nombre de la Planta <span className="modal-required">*</span>
        </label>
        <input
          className={`modal-input${err.name ? " modal-input-error" : ""}`}
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ej. Planta Norte"
          autoFocus
        />
        {err.name && <span className="modal-field-error">{err.name}</span>}
      </div>
    );

    if (tab === "users") return (
      <>
        <div className="modal-form-group">
          <label className="modal-label">Nombre completo <span className="modal-required">*</span></label>
          <input
            className={`modal-input${err.full_name ? " modal-input-error" : ""}`}
            value={data.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Ej. Juan Pérez"
            autoFocus
          />
          {err.full_name && <span className="modal-field-error">{err.full_name}</span>}
        </div>
        <div className="modal-form-group">
          <label className="modal-label">Correo electrónico <span className="modal-required">*</span></label>
          <input
            className={`modal-input${err.email ? " modal-input-error" : ""}`}
            type="email"
            value={data.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="Ej. juan@nissan.com"
          />
          {err.email && <span className="modal-field-error">{err.email}</span>}
        </div>
        <div className="modal-form-group">
          <label className="modal-label">
            Contraseña{" "}
            {modal.mode === "create"
              ? <span className="modal-required">*</span>
              : <span className="modal-hint">(vacío = no cambiar)</span>}
          </label>
          <input
            className={`modal-input${err.password ? " modal-input-error" : ""}`}
            type="password"
            value={data.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="••••••••"
          />
          {err.password && <span className="modal-field-error">{err.password}</span>}
        </div>
        <div className="modal-form-row">
          <div className="modal-form-group">
            <label className="modal-label">Planta <span className="modal-required">*</span></label>
            <select
              className={`modal-input${err.id_plant ? " modal-input-error" : ""}`}
              value={data.id_plant}
              onChange={(e) => set("id_plant", e.target.value)}
            >
              <option value="">— Seleccionar —</option>
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {err.id_plant && <span className="modal-field-error">{err.id_plant}</span>}
          </div>
          <div className="modal-form-group">
            <label className="modal-label">Rol <span className="modal-required">*</span></label>
            <select
              className={`modal-input${err.id_role ? " modal-input-error" : ""}`}
              value={data.id_role}
              onChange={(e) => set("id_role", e.target.value)}
            >
              <option value="">— Seleccionar —</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {err.id_role && <span className="modal-field-error">{err.id_role}</span>}
          </div>
        </div>
      </>
    );

    if (tab === "svByArea") return (
      <>
        <div className="modal-form-group">
          <label className="modal-label">Planta <span className="modal-required">*</span></label>
          <select
            className={`modal-input${err.id_plant ? " modal-input-error" : ""}`}
            value={data.id_plant}
            onChange={(e) => set("id_plant", e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {err.id_plant && <span className="modal-field-error">{err.id_plant}</span>}
        </div>
        <div className="modal-form-group">
          <label className="modal-label">Área <span className="modal-required">*</span></label>
          <select
            className={`modal-input${err.id_area ? " modal-input-error" : ""}`}
            value={data.id_area}
            onChange={(e) => set("id_area", e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {err.id_area && <span className="modal-field-error">{err.id_area}</span>}
        </div>
        <div className="modal-form-group">
          <label className="modal-label">Supervisor (SV) <span className="modal-required">*</span></label>
          <select
            className={`modal-input${err.id_user ? " modal-input-error" : ""}`}
            value={data.id_user}
            onChange={(e) => set("id_user", e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {users
              .filter((u) => roleName(u.id_role) === "Supervisor")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
          </select>
          {err.id_user && <span className="modal-field-error">{err.id_user}</span>}
        </div>
      </>
    );
  };

  const currentTab = TABS.find((t) => t.key === activeTab);
  const isEdit     = modal?.mode === "edit";
  const countMap   = { areas, plants, users, svByArea: svList };

  if (role !== "Admin") return null;

  return (
    <div className="admin-page">
      <div className="admin-container">

        {/* ── Toast ───────────────────────────────────────────────────── */}
        {toast && (
          <div className={`admin-toast admin-toast-${toast.type}`}>
            {toast.type === "success" ? "✅" : "❌"} {toast.msg}
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="animate-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, textAlign: "left" }}>Panel de Administrador</h1>
            <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Gestión de catálogos del sistema — solo acceso Admin
            </p>
          </div>
          <span className="category-badge" style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
            Admin
          </span>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <div className="admin-panel-tabs animate-in animate-in-delay-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`admin-panel-tab${activeTab === t.key ? " admin-panel-tab-active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              <span>{t.icon}</span> {t.label}
              <span className="admin-panel-tab-count">{countMap[t.key]?.length ?? 0}</span>
            </button>
          ))}
        </div>

        {/* ── Sección activa ──────────────────────────────────────────── */}
        <div className="animate-in animate-in-delay-2">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "24px 0 16px", flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ margin: 0 }}>
              {currentTab?.icon} {currentTab?.label}
            </h2>
            <button
              className="btn-save"
              onClick={openCreate}
              disabled={loading}
              style={{ padding: "10px 22px", display: "flex", alignItems: "center", gap: 8 }}
            >
              + Crear nuevo
            </button>
          </div>

          <div className="admin-table-wrapper">
            {loading
              ? <div className="admin-loading"><span className="admin-spinner" />Cargando...</div>
              : renderTable()
            }
          </div>
        </div>
      </div>

      {/* ── Modal Crear / Editar ─────────────────────────────────────── */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, color: "var(--primary)", fontSize: "1.05rem" }}>
                {isEdit ? "✏️ Editar" : "➕ Crear"} {currentTab?.label}
              </h3>
              <button className="admin-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              {renderForm()}
            </div>
            <div className="admin-modal-footer">
              <button
                className="btn-edit"
                onClick={() => setModal(null)}
                style={{ padding: "10px 20px" }}
              >
                Cancelar
              </button>
              <button
                className="btn-save"
                onClick={handleSave}
                disabled={loading}
                style={{ padding: "10px 24px" }}
              >
                {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar eliminación ──────────────────────────────── */}
      {confirm && (
        <div className="admin-modal-overlay" onClick={() => setConfirm(null)}>
          <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, color: "var(--primary)", fontSize: "1.05rem" }}>
                🗑️ Confirmar eliminación
              </h3>
              <button className="admin-modal-close" onClick={() => setConfirm(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
                ¿Estás seguro de eliminar <strong>"{confirm.name}"</strong>?
              </p>
              <p style={{ color: "var(--primary)", fontSize: "0.85rem", marginTop: 8 }}>
                ⚠️ Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="btn-edit" onClick={() => setConfirm(null)} style={{ padding: "10px 20px" }}>
                Cancelar
              </button>
              <button
                className="btn-save"
                onClick={handleDelete}
                disabled={loading}
                style={{ padding: "10px 24px", background: "linear-gradient(135deg, #b91c1c, #7f1d1d)" }}
              >
                {loading ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
