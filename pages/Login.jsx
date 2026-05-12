import { useState } from "react";
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
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    //  Logs de verificación 
    console.log(" Click en Ingresar");
    console.log(" Datos enviados al backend:", form);

    setError("");
    setLoading(true);

    try {
      //  LOGIN REAL
      const data = await loginRequest(form.email, form.password);

      console.log(" Respuesta del backend:", data);

      //  Guardar token y usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      //  Redirigir
      navigate("/");
    } catch (err) {
      console.error(" Error login:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Iniciar sesión</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Correo
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