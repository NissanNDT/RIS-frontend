import React, { useState, useEffect } from "react";
import { createFinding, getPlants, getAreas } from "../services/findingService";
import "../App.css";

const ReporteDeHallazgos = () => {
  const [formData, setFormData] = useState({
    description: "",
    plant_id: "",
    area_id: "",
    location: "",
    finding_category: "",
    image: null,
  });

  const [plants, setPlants] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

  // Load plants and areas on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plantsData, areasData] = await Promise.all([
          getPlants(),
          getAreas(),
        ]);
        setPlants(plantsData);
        setAreas(areasData);
      } catch (err) {
        console.error("Error cargando catálogos:", err);
        setStatus({ type: "error", message: "No se pudieron cargar las opciones del formulario." });
      }
    };
    fetchData();
  }, []);

  // Filter areas whenever selected plant changes
  useEffect(() => {
    if (formData.plant_id) {
      const related = areas.filter(
        (area) =>
          String(area.id_plant ?? area.plant_id ?? area.id_planta) === String(formData.plant_id)
      );
      setFilteredAreas(related.length ? related : areas); // fallback: show all if no FK match
    } else {
      setFilteredAreas([]);
    }
    // Reset selected area when plant changes
    setFormData((prev) => ({ ...prev, area_id: "" }));
  }, [formData.plant_id, areas]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const payload = new FormData();
    payload.append("description", formData.description);
    payload.append("id_plant", formData.plant_id);
    payload.append("id_area", formData.area_id);
    payload.append("location", formData.location);
    payload.append("finding_category", formData.finding_category);
    if (formData.image) {
      payload.append("image", formData.image);
    }
    console.log(formData,payload);
    try {
      await createFinding(payload);
      setStatus({ type: "success", message: "¡Hallazgo reportado correctamente!" });
      // Reset form
      setFormData({
        description: "",
        plant_id: "",
        area_id: "",
        location: "",
        finding_category: "",
        image: null,
      });
      // Clear file input manually
      const fileInput = document.getElementById("finding-image-input");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("Error al enviar hallazgo:", err);
      console.error("Respuesta backend:", err.response?.data);
      const msg =
        err?.response?.data?.message ||
        "Ocurrió un error al guardar el hallazgo. Inténtalo de nuevo.";
      setStatus({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <h1>Reporte de Hallazgos</h1>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">

          {/* Planta */}
          <label>
            Planta
            <select
              name="plant_id"
              value={formData.plant_id}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una planta</option>
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          </label>

          {/* Área (filtrada según planta seleccionada) */}
          <label>
            Área
            <select
              name="area_id"
              value={formData.area_id}
              onChange={handleChange}
              required
              disabled={!formData.plant_id}
            >
              <option value="">
                {formData.plant_id ? "Selecciona un área" : "Primero elige una planta"}
              </option>
              {filteredAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre ?? area.name}
                </option>
              ))}
            </select>
          </label>

          {/* Lugar / Proceso */}
          <label>
            Lugar, Proceso, Equipo, Operación
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Ej. Línea de ensamble A3"
              required
            />
          </label>

          {/* Descripción del hallazgo */}
          <label>
            Hallazgo
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe el hallazgo encontrado..."
              required
            />
          </label>

          {/* Imagen */}
          <label>
            Imagen del Hallazgo
            <input
              id="finding-image-input"
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>

          {/* Acto / Condición */}
          <label>
            Acto/Condición Insegura
            <select
              name="finding_category"
              value={formData.finding_category}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una categoría</option>
              <option value="Acto Inseguro">Acto Inseguro</option>
              <option value="Condición Insegura">Condición Insegura</option>
              <option value="Condición NG">Condición NG</option>
            </select>
          </label>
        </div>

        {/* Status feedback */}
        {status && (
          <div className={`form-status ${status.type}`}>
            {status.message}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "ENVIANDO..." : "ENVIAR"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReporteDeHallazgos;