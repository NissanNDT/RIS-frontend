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

// ─── Utilidades ────────────────────────────────────────────────────────────
const TABS = [
  { key: "areas",    label: "Áreas",       icon: "🗂️" },
  { key: "plants",   label: "Plantas",     icon: "🏭" },
  { key: "users",    label: "Usuarios",    icon: "👥" },
  { key: "svByArea", label: "SV por Área", icon: "🔗" },
];

const EMPTY_AREA    = { nombre: "" };
const EMPTY_PLANT   = { name: "" };
const EMPTY_USER    = { full_name: "", email: "", password: "", id_plant: "", id_role: "" };
const EMPTY_SV      = { id_plant: "", id_area: "", id_user: "" };

// ─── Componente principal ──────────────────────────────────────────────────
const AdminPanel = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  // Guard de rol
  useEffect(() => {
    if (role !== "Admin") navigate("/", { replace: true });
  }, [role, navigate]);

  // ── Estado global ──
  const [activeTab, setActiveTab] = useState("areas");

  const [areas,   setAreas]   = useState([]);
  const [plants,  setPlants]  = useState([]);
  const [users,   setUsers]   = useState([]);
  const [svList,  setSvList]  = useState([]);
  const [roles,   setRoles]   = useState([]);

  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState(null); // { type: "success"|"error", msg }
  const [modal,    setModal]    = useState(null); // { mode: "create"|"edit", tab, data }
  const [confirm,  setConfirm]  = useState(null); // { tab, id, name }
  const [formErr,  setFormErr]  = useState({});

  // ── Toast auto-dismiss ──
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (type, msg) => setToast({ type, msg });

  // ── Carga de datos ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p, u, sv, r] = await Promise.all([
        getAreas(), getPlants(), getUsers(), getSvByArea(), getRoles(),
      ]);
      setAreas(a);
      setPlants(p);
      setUsers(u);
      setSvList(sv);
      setRoles(r);
    } catch {
      showToast("error", "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "Admin") loadAll();
  }, [role, loadAll]);

  // ── Helpers de nombre ──
  const plantName  = (id) => plants.find((p) => p.id === id)?.name  || id;
  const areaName   = (id) => areas.find((a)  => a.id === id)?.nombre || id;
  const userName   = (id) => users.find((u)  => u.id === id)?.full_name || id;
  const roleName   = (id) => roles.find((r)  => r.id === id)?.name  || id;

  // ─── Validación ─────────────────────────────────────────────────────────
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

  // ─── Abrir modal ────────────────────────────────────────────────────────
  const openCreate = () => {
    const defaults = { areas: EMPTY_AREA, plants: EMPTY_PLANT, users: EMPTY_USER, svByArea: EMPTY_SV };
    setFormErr({});
    setModal({ mode: "create", tab: activeTab, data: { ...defaults[activeTab] } });
  };

  const openEdit = (tab, item) => {
    setFormErr({});
    let data;
    if (tab === "areas")    data = { nombre: item.nombre };
    if (tab === "plants")   data = { name: item.name };
    if (tab === "users")    data = { full_name: item.full_name, email: item.email, password: "", id_plant: item.id_plant, id_role: item.id_role };
    if (tab === "svByArea") data = { id_plant: item.id_plant, id_area: item.id_area, id_user: item.id_user };
    setModal({ mode: "edit", tab, id: item.id, data });
  };

  // ─── Guardar (crear / editar) ────────────────────────────────────────────
  const handleSave = async () => {
    const { mode, tab, id, data } = modal;
    const errors = validate(tab, data, mode === "edit");
    if (Object.keys(errors).length) { setFormErr(errors); return; }

    setLoading(true);
    try {
      if (tab === "areas") {
        mode === "create"
          ? await createArea(data.nombre)
          : await updateArea(id, data.nombre);
      }
      if (tab === "plants") {
        mode === "create"
          ? await createPlant(data.name)
          : await updatePlant(id, data.name);
      }
      if (tab === "users") {
        const payload = { full_name: data.full_name, email: data.email, id_plant: Number(data.id_plant), id_role: Number(data.id_role) };
        if (data.password?.trim()) payload.password = data.password;
        mode === "create"
          ? await createUser({ ...payload, password: data.password })
          : await updateUser(id, payload);
      }
      if (tab === "svByArea") {
        const payload = { id_plant: Number(data.id_plant), id_area: Number(data.id_area), id_user: Number(data.id_user) };
        mode === "create"
          ? await createSvByArea(payload)
          : await updateSvByArea(id, payload);
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

  // ─── Eliminar ────────────────────────────────────────────────────────────
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

  // ─── Render de tablas ────────────────────────────────────────────────────
  const renderTable = () => {
    if (loading && areas.length === 0) return <div className="ap-loading"><span className="ap-spinner" />Cargando...</div>;

    if (activeTab === "areas") return (
      <table className="ap-table">
        <thead><tr><th>#</th><th>Nombre</th><th>Acciones</th></tr></thead>
        <tbody>
          {areas.length === 0 && <tr><td colSpan={3} className="ap-empty">Sin registros</td></tr>}
          {areas.map((a) => (
            <tr key={a.id}>
              <td className="ap-id">{a.id}</td>
              <td>{a.nombre}</td>
              <td className="ap-actions">
                <button className="ap-btn-edit"   onClick={() => openEdit("areas", a)}>✏️ Editar</button>
                <button className="ap-btn-delete" onClick={() => setConfirm({ tab: "areas", id: a.id, name: a.nombre })}>🗑️ Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (activeTab === "plants") return (
      <table className="ap-table">
        <thead><tr><th>#</th><th>Nombre</th><th>Acciones</th></tr></thead>
        <tbody>
          {plants.length === 0 && <tr><td colSpan={3} className="ap-empty">Sin registros</td></tr>}
          {plants.map((p) => (
            <tr key={p.id}>
              <td className="ap-id">{p.id}</td>
              <td>{p.name}</td>
              <td className="ap-actions">
                <button className="ap-btn-edit"   onClick={() => openEdit("plants", p)}>✏️ Editar</button>
                <button className="ap-btn-delete" onClick={() => setConfirm({ tab: "plants", id: p.id, name: p.name })}>🗑️ Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (activeTab === "users") return (
      <table className="ap-table">
        <thead><tr><th>#</th><th>Nombre</th><th>Correo</th><th>Planta</th><th>Rol</th><th>Acciones</th></tr></thead>
        <tbody>
          {users.length === 0 && <tr><td colSpan={6} className="ap-empty">Sin registros</td></tr>}
          {users.map((u) => (
            <tr key={u.id}>
              <td className="ap-id">{u.id}</td>
              <td>{u.full_name}</td>
              <td className="ap-muted">{u.email}</td>
              <td><span className="ap-badge ap-badge-blue">{plantName(u.id_plant)}</span></td>
              <td><span className={`ap-badge ${u.id_role === 1 ? "ap-badge-gold" : "ap-badge-grey"}`}>{roleName(u.id_role)}</span></td>
              <td className="ap-actions">
                <button className="ap-btn-edit"   onClick={() => openEdit("users", u)}>✏️ Editar</button>
                <button className="ap-btn-delete" onClick={() => setConfirm({ tab: "users", id: u.id, name: u.full_name })}>🗑️ Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (activeTab === "svByArea") return (
      <table className="ap-table">
        <thead><tr><th>#</th><th>Planta</th><th>Área</th><th>Usuario (SV)</th><th>Acciones</th></tr></thead>
        <tbody>
          {svList.length === 0 && <tr><td colSpan={5} className="ap-empty">Sin registros</td></tr>}
          {svList.map((sv) => (
            <tr key={sv.id}>
              <td className="ap-id">{sv.id}</td>
              <td><span className="ap-badge ap-badge-blue">{plantName(sv.id_plant)}</span></td>
              <td>{areaName(sv.id_area)}</td>
              <td>{userName(sv.id_user)}</td>
              <td className="ap-actions">
                <button className="ap-btn-edit"   onClick={() => openEdit("svByArea", sv)}>✏️ Editar</button>
                <button className="ap-btn-delete" onClick={() => setConfirm({ tab: "svByArea", id: sv.id, name: `SV #${sv.id}` })}>🗑️ Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // ─── Render de formulario del modal ─────────────────────────────────────
  const renderForm = () => {
    if (!modal) return null;
    const { tab, data } = modal;
    const set = (field, value) => setModal((m) => ({ ...m, data: { ...m.data, [field]: value } }));
    const err = formErr;

    if (tab === "areas") return (
      <div className="ap-form-group">
        <label className="ap-label">Nombre del Área <span className="ap-required">*</span></label>
        <input className={`ap-input${err.nombre ? " ap-input-error" : ""}`} value={data.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Ej. Producción" autoFocus />
        {err.nombre && <span className="ap-field-error">{err.nombre}</span>}
      </div>
    );

    if (tab === "plants") return (
      <div className="ap-form-group">
        <label className="ap-label">Nombre de la Planta <span className="ap-required">*</span></label>
        <input className={`ap-input${err.name ? " ap-input-error" : ""}`} value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej. Planta Norte" autoFocus />
        {err.name && <span className="ap-field-error">{err.name}</span>}
      </div>
    );

    if (tab === "users") return (
      <>
        <div className="ap-form-group">
          <label className="ap-label">Nombre completo <span className="ap-required">*</span></label>
          <input className={`ap-input${err.full_name ? " ap-input-error" : ""}`} value={data.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Ej. Juan Pérez" autoFocus />
          {err.full_name && <span className="ap-field-error">{err.full_name}</span>}
        </div>
        <div className="ap-form-group">
          <label className="ap-label">Correo electrónico <span className="ap-required">*</span></label>
          <input className={`ap-input${err.email ? " ap-input-error" : ""}`} type="email" value={data.email} onChange={(e) => set("email", e.target.value)} placeholder="Ej. juan@nissan.com" />
          {err.email && <span className="ap-field-error">{err.email}</span>}
        </div>
        <div className="ap-form-group">
          <label className="ap-label">Contraseña {modal.mode === "create" && <span className="ap-required">*</span>}{modal.mode === "edit" && <span className="ap-hint">(dejar vacío para no cambiar)</span>}</label>
          <input className={`ap-input${err.password ? " ap-input-error" : ""}`} type="password" value={data.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" />
          {err.password && <span className="ap-field-error">{err.password}</span>}
        </div>
        <div className="ap-form-row">
          <div className="ap-form-group">
            <label className="ap-label">Planta <span className="ap-required">*</span></label>
            <select className={`ap-select${err.id_plant ? " ap-input-error" : ""}`} value={data.id_plant} onChange={(e) => set("id_plant", e.target.value)}>
              <option value="">— Seleccionar —</option>
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {err.id_plant && <span className="ap-field-error">{err.id_plant}</span>}
          </div>
          <div className="ap-form-group">
            <label className="ap-label">Rol <span className="ap-required">*</span></label>
            <select className={`ap-select${err.id_role ? " ap-input-error" : ""}`} value={data.id_role} onChange={(e) => set("id_role", e.target.value)}>
              <option value="">— Seleccionar —</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {err.id_role && <span className="ap-field-error">{err.id_role}</span>}
          </div>
        </div>
      </>
    );

    if (tab === "svByArea") return (
      <>
        <div className="ap-form-group">
          <label className="ap-label">Planta <span className="ap-required">*</span></label>
          <select className={`ap-select${err.id_plant ? " ap-input-error" : ""}`} value={data.id_plant} onChange={(e) => set("id_plant", e.target.value)}>
            <option value="">— Seleccionar —</option>
            {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {err.id_plant && <span className="ap-field-error">{err.id_plant}</span>}
        </div>
        <div className="ap-form-group">
          <label className="ap-label">Área <span className="ap-required">*</span></label>
          <select className={`ap-select${err.id_area ? " ap-input-error" : ""}`} value={data.id_area} onChange={(e) => set("id_area", e.target.value)}>
            <option value="">— Seleccionar —</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          {err.id_area && <span className="ap-field-error">{err.id_area}</span>}
        </div>
        <div className="ap-form-group">
          <label className="ap-label">Usuario (SV) <span className="ap-required">*</span></label>
          <select className={`ap-select${err.id_user ? " ap-input-error" : ""}`} value={data.id_user} onChange={(e) => set("id_user", e.target.value)}>
            <option value="">— Seleccionar —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
          {err.id_user && <span className="ap-field-error">{err.id_user}</span>}
        </div>
      </>
    );
  };

  const tabLabel = TABS.find((t) => t.key === activeTab)?.label || "";
  const isEdit   = modal?.mode === "edit";

  if (role !== "Admin") return null;

  return (
    <div className="ap-page">

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <div className={`ap-toast ap-toast-${toast.type}`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────── */}
      <div className="ap-header">
        <div className="ap-header-content">
          <div>
            <h1 className="ap-title">Panel de Administrador</h1>
            <p className="ap-subtitle">Gestión de catálogos del sistema</p>
          </div>
          <div className="ap-header-badge">
            <span className="ap-badge ap-badge-gold">👑 Admin</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="ap-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`ap-tab${activeTab === t.key ? " ap-tab-active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            <span className="ap-tab-icon">{t.icon}</span>
            <span className="ap-tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Cuerpo ────────────────────────────────────────── */}
      <div className="ap-body">
        <div className="ap-section-header">
          <h2 className="ap-section-title">
            {TABS.find((t) => t.key === activeTab)?.icon} {tabLabel}
            <span className="ap-count">
              {{ areas, plants, users, svByArea: svList }[activeTab]?.length ?? 0} registros
            </span>
          </h2>
          <button className="ap-btn-create" onClick={openCreate} disabled={loading}>
            + Crear nuevo
          </button>
        </div>

        <div className="ap-table-wrapper">
          {renderTable()}
        </div>
      </div>

      {/* ── Modal Crear / Editar ───────────────────────────── */}
      {modal && (
        <div className="ap-modal-overlay" onClick={() => setModal(null)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h3 className="ap-modal-title">
                {isEdit ? "✏️ Editar" : "➕ Crear"} {tabLabel}
              </h3>
              <button className="ap-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="ap-modal-body">
              {renderForm()}
            </div>
            <div className="ap-modal-footer">
              <button className="ap-btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="ap-btn-save" onClick={handleSave} disabled={loading}>
                {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar eliminación ────────────────────── */}
      {confirm && (
        <div className="ap-modal-overlay" onClick={() => setConfirm(null)}>
          <div className="ap-modal ap-modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h3 className="ap-modal-title">🗑️ Confirmar eliminación</h3>
              <button className="ap-modal-close" onClick={() => setConfirm(null)}>✕</button>
            </div>
            <div className="ap-modal-body">
              <p className="ap-confirm-msg">
                ¿Estás seguro de que deseas eliminar <strong>"{confirm.name}"</strong>?<br />
                <span className="ap-confirm-warn">Esta acción no se puede deshacer.</span>
              </p>
            </div>
            <div className="ap-modal-footer">
              <button className="ap-btn-cancel" onClick={() => setConfirm(null)}>Cancelar</button>
              <button className="ap-btn-delete-confirm" onClick={handleDelete} disabled={loading}>
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
