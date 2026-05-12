import React, { useState } from "react";
import { createFinding } from "../services/findingService";
import "../App.css";

const ReporteDeHallazgos = () => {
  const [formData, setFormData] = useState({
    description: "",
    id_plant: "",
    id_area: "",
    location: "",
    id_responsible_user: "",
    finding_category: "",
    image: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    // Send formDataToSend to the backend
    console.log("Form data submitted:", formDataToSend);
  };

  return (
    <div className="form-page">
      <h1>Reporte de Hallazgos</h1>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Planta
            <select
              name="id_plant"
              value={formData.id_plant}
              onChange={handleChange}
              required
            >
              <option value="">Find items</option>
              {}
            </select>
          </label>

          <label>
            Área
            <select
              name="id_area"
              value={formData.id_area}
              onChange={handleChange}
              required
            >
              <option value="">Find items</option>
              {}
            </select>
          </label>

          <label>
            Lugar, Proceso, Equipo, Operación
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Hallazgo
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Imagen del Hallazgo
            <input
              type="file"
              name="image"
              onChange={handleFileChange}
              required
            />
          </label>

          <label>
            Responsable de Área
            <select
              name="id_responsible_user"
              value={formData.id_responsible_user}
              onChange={handleChange}
              required
            >
              <option value="">Find items</option>
              {/* Add options dynamically */}
            </select>
          </label>

          <label>
            Acto/Condición Insegura
            <select
              name="finding_category"
              value={formData.finding_category}
              onChange={handleChange}
              required
            >
              <option value="">Find items</option>
              <option value="acto inseguro">Acto Inseguro</option>
              <option value="condicion insegura">Condición Insegura</option>
              <option value="condicion ng">Condición NG</option>
            </select>
          </label>
        </div>

        <button type="submit" className="submit-button">ENVIAR</button>
      </form>
    </div>
  );
};

export default ReporteDeHallazgos;