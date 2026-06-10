import React, { useState, useEffect } from "react";
import { getUser, updateUser } from "../services/adminService";
import "../App.css";

const MiPerfil = () => {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).id : null;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    } else {
      setError("No se pudo identificar al usuario autenticado.");
      setFetching(false);
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setFetching(true);
      setError("");
      const userData = await getUser(userId);
      setForm({
        full_name: userData.full_name || "",
        email: userData.email || "",
        password: "", // empty by default
      });
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Error al cargar los datos del perfil.");
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.full_name.trim()) {
      setError("El nombre completo es requerido.");
      return;
    }
    if (!form.email.trim()) {
      setError("El correo electrónico es requerido.");
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(form.email)) {
      setError("Formato de correo electrónico inválido.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      const updatedUser = await updateUser(userId, payload);

      // Actualizar localStorage/context/auth state para reflejar cambios sin cerrar sesión
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.name = updatedUser.full_name;
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      setSuccess("¡Perfil actualizado con éxito!");
      setForm((prev) => ({ ...prev, password: "" })); // clear password field
      
      // Forzar recarga de componentes que dependen del navbar u otros datos
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error("Error updating profile:", err);
      const detail = err.response?.data?.error || err.message || "Error al actualizar el perfil.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="admin-page">
        <div className="admin-container" style={{ textAlign: "center", padding: "100px 0" }}>
          <span className="admin-spinner" style={{ display: "inline-block", margin: "0 auto 20px" }}></span>
          <p style={{ color: "var(--text-secondary)" }}>Cargando datos del perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: "500px" }}>
        <h2 style={{ marginBottom: "16px" }}>Mi Perfil</h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "32px" }}>
          Actualiza tu información personal de cuenta
        </p>

        {success && (
          <div className="admin-success animate-in" style={{ marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
            {success}
          </div>
        )}

        {error && (
          <div className="login-error animate-in" style={{ marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Nombre Completo
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Nombre completo"
              required
            />
          </label>

          <label>
            Correo Electrónico
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="correo@nissan.com"
              required
            />
          </label>

          <label>
            Nueva Contraseña
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Dejar vacío para conservar contraseña"
            />
          </label>

          <button type="submit" disabled={loading} style={{ marginTop: "16px" }}>
            {loading ? "Guardando cambios..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MiPerfil;
