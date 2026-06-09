import React, { useState, useEffect } from "react";
import { createFinding, getPlants, getAreas } from "../services/findingService";
import { uploadImage, deleteImage, getSignedImageUrl } from "../utils/supabaseStorage";
import "../App.css";

const ReporteDeHallazgos = () => {
  const [draftId, setDraftId] = useState(() => "temp-" + Date.now() + Math.random().toString(36).substring(2, 7));
  const [formData, setFormData] = useState({
    description: "",
    plant_id: "",
    area_id: "",
    location: "",
    finding_category: "",
    finding_type: "SES",
    finding_image_path: "",
    countermeasure_image_path: "",
  });

  const [plants, setPlants] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Image states
  const [uploadingFinding, setUploadingFinding] = useState(false);
  const [uploadingCountermeasure, setUploadingCountermeasure] = useState(false);
  const [findingPreview, setFindingPreview] = useState("");
  const [countermeasurePreview, setCountermeasurePreview] = useState("");

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateImage = (file) => {
    const allowedExtensions = ["jpg", "jpeg", "png"];
    const extension = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return "Solo se permiten imágenes JPG, JPEG o PNG.";
    }
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      return "La imagen no debe superar los 5MB.";
    }
    return null;
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setStatus({ type: "error", message: validationError });
      e.target.value = "";
      return;
    }

    if (type === "finding") {
      setUploadingFinding(true);
    } else {
      setUploadingCountermeasure(true);
    }
    setStatus(null);

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const extension = file.name.split(".").pop().toLowerCase();
      
      const previousPath = type === "finding" ? formData.finding_image_path : formData.countermeasure_image_path;
      if (previousPath) {
        await deleteImage(previousPath);
      }

      const path = `finding-${draftId}/${type}-${timestamp}.${extension}`;
      await uploadImage(file, path);
      
      const signedUrl = await getSignedImageUrl(path);

      setFormData((prev) => ({
        ...prev,
        [type === "finding" ? "finding_image_path" : "countermeasure_image_path"]: path,
      }));

      if (type === "finding") {
        setFindingPreview(signedUrl);
      } else {
        setCountermeasurePreview(signedUrl);
      }
    } catch (err) {
      console.error(`Error al subir la imagen de ${type}:`, err);
      setStatus({ type: "error", message: `Error al subir la imagen de ${type}. Inténtalo de nuevo.` });
      e.target.value = "";
    } finally {
      if (type === "finding") {
        setUploadingFinding(false);
      } else {
        setUploadingCountermeasure(false);
      }
    }
  };

  const handleRemoveImage = async (type) => {
    const path = type === "finding" ? formData.finding_image_path : formData.countermeasure_image_path;
    if (!path) return;

    if (type === "finding") {
      setUploadingFinding(true);
    } else {
      setUploadingCountermeasure(true);
    }

    try {
      await deleteImage(path);
      setFormData((prev) => ({
        ...prev,
        [type === "finding" ? "finding_image_path" : "countermeasure_image_path"]: "",
      }));
      if (type === "finding") {
        setFindingPreview("");
        const input = document.getElementById("finding-image-input");
        if (input) input.value = "";
      } else {
        setCountermeasurePreview("");
        const input = document.getElementById("countermeasure-image-input");
        if (input) input.value = "";
      }
    } catch (err) {
      console.error("Error al borrar imagen:", err);
    } finally {
      if (type === "finding") {
        setUploadingFinding(false);
      } else {
        setUploadingCountermeasure(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const payload = {
      description: formData.description,
      id_plant: Number(formData.plant_id),
      id_area: Number(formData.area_id),
      location: formData.location,
      finding_category: formData.finding_category,
      finding_image_path: formData.finding_image_path || null,
      countermeasure_image_path: formData.countermeasure_image_path || null,
      finding_type: formData.finding_type
    };

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
        finding_type: "General",
        finding_image_path: "",
        countermeasure_image_path: "",
      });
      setFindingPreview("");
      setCountermeasurePreview("");
      setDraftId("temp-" + Date.now() + Math.random().toString(36).substring(2, 7));

      // Clear file inputs
      const fInput = document.getElementById("finding-image-input");
      if (fInput) fInput.value = "";
      const cInput = document.getElementById("countermeasure-image-input");
      if (cInput) cInput.value = "";
    } catch (err) {
      console.error("Error al enviar hallazgo:", err);
      const msg =
        err?.response?.data?.error ||
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

          {/* Área */}
          <label>
            Área
            <select
              name="area_id"
              value={formData.area_id}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un área</option>
              {areas.map((area) => (
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

          {/* Tipo de Hallazgo */}
          <label>
            Tipo de Hallazgo
            <select
              name="finding_type"
              value={formData.finding_type}
              onChange={handleChange}
              required
            >
              <option value="SES">SES</option>
              <option value="FPES">FPES</option>
              <option value="5S">5S</option>

            </select>
          </label>

          {/* Descripción del hallazgo */}
          <label style={{ gridColumn: "1 / -1" }}>
            Hallazgo
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe el hallazgo encontrado..."
              required
            />
          </label>

          {/* Imagen Hallazgo */}
          <label>
            Imagen del Hallazgo
            <input
              id="finding-image-input"
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => handleImageUpload(e, "finding")}
              disabled={uploadingFinding}
            />
            {uploadingFinding && <span className="upload-loading">Subiendo imagen...</span>}
            {findingPreview && (
              <div className="image-preview-container" style={{ marginTop: "10px", position: "relative" }}>
                <img src={findingPreview} alt="Preview Hallazgo" style={{ maxWidth: "100%", maxHeight: "150px", borderRadius: "6px" }} />
                <button type="button" className="btn-cancel" style={{ display: "block", marginTop: "5px", padding: "2px 8px", fontSize: "0.8rem" }} onClick={() => handleRemoveImage("finding")}>
                  Eliminar imagen
                </button>
              </div>
            )}
          </label>
        </div>

        {/* Status feedback */}
        {status && (
          <div className={`form-status ${status.type}`}>
            {status.message}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "20px" }}>
          <button type="submit" className="submit-button" disabled={loading || uploadingFinding || uploadingCountermeasure}>
            {loading ? "ENVIANDO..." : "ENVIAR"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReporteDeHallazgos;