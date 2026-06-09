import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../services/authService";
import "../App.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "true") {
      setMessage("Sesión expirada, inicia sesión nuevamente");
    }
  }, []);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("✅ Click en Ingresar");
    console.log("📤 Datos enviados al backend:", form);

    setError("");
    setLoading(true);

    try {
      // ✅ LOGIN REAL
      const data = await loginRequest(form.email, form.password);

      console.log("✅ Respuesta del backend:", data);

      // ✅ SOLO GUARDAR USUARIO
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // ✅ GUARDAR ROL
      if (data.user && data.user.role) {
        localStorage.setItem("role", data.user.role);
      }

      // ✅ GUARDAR TOKEN
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // ✅ Redirigir
      navigate("/");

    } catch (err) {
      console.error("❌ Error login:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Iniciar sesión</h2>

        {message && (
          <p className="login-message" style={{ color: "#e0a800", fontWeight: "bold", textAlign: "center", marginBottom: "15px" }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Correo -debe ir en minusculas-
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
