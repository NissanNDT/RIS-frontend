import React, { useState, useEffect } from "react";
import {
  createIncident,
  createIncidentFormat,
  getFactorTreeByIncidentFormat,
  createFactorTree,
  getIncidentById,
  updateIncident,
  getIncidentFormatByIncident,
  updateIncidentFormat,
  updateFactorTree,
  getInterveningFactorsByIncidentFormat,
  createInterveningFactor,
  updateInterveningFactor,
  getHazardBackgroundByIncidentFormat,
  createHazardBackground,
  updateHazardBackground,
  getCountermeasurePlanByIncidentFormat,
  createCountermeasurePlan,
  updateCountermeasurePlan,
  getControlHierarchies,
  getVerificationMethods,
  getAnalysisParticipantsByIncidentFormat,
  createAnalysisParticipant,
  updateAnalysisParticipant,
  getCostCenters,
  deleteFactorTree,
  deleteCountermeasurePlan,
  deleteAnalysisParticipant,
  deleteHazardBackground,
  deleteInterveningFactor,
  downloadIncidentExcel
} from "../services/incidentService";
import { getPlants, getAreas } from "../services/findingService";
import { useLocation, useParams } from "react-router-dom";
import "../styles/LlenadoFormatoIncidente.css";

const LlenadoFormatoIncidente = () => {
  const locationState = useLocation();
  const { id: paramId } = useParams();
  const passedIncident = locationState.state?.incident || null;
  const initialId = passedIncident?.id || passedIncident?.incident_folio || paramId || null;
  const [currentIncidentId, setCurrentIncidentId] = useState(initialId);

  // ── Estado exclusivo para la sección Datos Generales (tabla incident_format) ──
  const [formData, setFormData] = useState({
    id_incident: currentIncidentId || "",
    employee_name: "",
    employee_age: "",
    employee_payroll_number: "",
    employee_position: "",
    employee_distribution: "",
    employee_seniority: "",
    employee_seniority_in_position: "",
    employee_type: "",
    accident_shift: "",
    sv_seniority: "",
    sv_seniority_in_position: "",
    number_of_staff_under_sv: "",
    attending_doctor: "",
    recovery_forecast: "",
  });

  const [submitStatus, setSubmitStatus] = useState(null); // null | "success" | "error"
  const [submitMessage, setSubmitMessage] = useState("");
  const [formatExists, setFormatExists] = useState(false);

  const [plants, setPlants] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    getPlants().then(setPlants).catch(() => { });
    getAreas().then(setAreas).catch(() => { });
  }, []);

  // ── Estado para la sección Árbol de Factores (tabla factor_tree) ──
  const emptyFactorRow = () => ({
    id_incident_format: "",
    "4m": "",
    factor: "",
    control_point: "",
    standard: "",
    actual: "",
    met_standard: "",
    met_safety: "",
    comments: "",
  });

  const [factorTree, setFactorTree] = useState([emptyFactorRow()]);
  const [ftStatus, setFtStatus] = useState(null);   // null | "success" | "error"
  const [ftMessage, setFtMessage] = useState("");
  const [ftLoading, setFtLoading] = useState(false);

  // ── ID del registro incident_format (PK) necesario para consultar factor_tree ──
  const [incidentFormatId, setIncidentFormatId] = useState(null);

  // ── Estado para la sección Factores que Intervienen (tabla intervening_factors) ──
  const [interveningFactors, setInterveningFactors] = useState([{ name: "" }]);
  const [ifStatus, setIfStatus] = useState(null);       // null | "success" | "error"
  const [ifMessage, setIfMessage] = useState("");
  const [ifLoading, setIfLoading] = useState(false);

  // ── Catálogos para Plan de Contramedidas y Participantes ──
  const [controlHierarchies, setControlHierarchies] = useState([]);
  const [verificationMethods, setVerificationMethods] = useState([]);
  const [costCenters, setCostCenters] = useState([]);

  useEffect(() => {
    getControlHierarchies()
      .then((data) => setControlHierarchies(Array.isArray(data) ? data : []))
      .catch(() => { });
    getVerificationMethods()
      .then((data) => setVerificationMethods(Array.isArray(data) ? data : []))
      .catch(() => { });
    getCostCenters()
      .then((data) => setCostCenters(Array.isArray(data) ? data : []))
      .catch(() => { });
  }, []);

  // ── Estado para la sección Participantes en el Análisis (tabla analysis_participant) ──
  const emptyParticipantRow = () => ({
    participant_type: "",
    name: "",
    department: "",
    id_cost_center: "",
  });

  const [analysisParticipants, setAnalysisParticipants] = useState([emptyParticipantRow()]);
  const [apStatus, setApStatus] = useState(null);       // null | "success" | "error"
  const [apMessage, setApMessage] = useState("");
  const [apLoading, setApLoading] = useState(false);

  // ── Estado para la sección Plan de Contramedidas (tabla countermeasure_plan) ──
  const emptyCpRow = () => ({
    id_control_hierarchy: "",
    id_verification_method: "",
    what: "",
    why: "",
    where_place: "",
    when_date: "",
    how: "",
    who: "",
    ok: "",
    ng: "",
    comment: "",
  });

  const [countermeasurePlan, setCountermeasurePlan] = useState([emptyCpRow()]);
  const [cpStatus, setCpStatus] = useState(null);   // null | "success" | "error"
  const [cpMessage, setCpMessage] = useState("");
  const [cpLoading, setCpLoading] = useState(false);

  // ── Estado para la sección Antecedentes de Peligro o Riesgo (tabla hazard_background) ──
  const [hazardBackground, setHazardBackground] = useState({
    id_incident_format: "",
    previous_fr1_incidents_presented: "",
    existing_processes_or_areas_potential_for_incident: "",
    processes_or_areas_potential_for_incident: "",
    risk_assessed_and_identified: "",
    incident_category: "",
    horizontal_review: "",
    horizontal_review_comment: "",
    new_risk_assessment_needed: "",
    safety_dojo_reception_date: "",
    genba_dojo_reception_date: "",
    negligence_type: "",
    labor_report: ""
  });
  const [hbStatus, setHbStatus] = useState(null);       // null | "success" | "error"
  const [hbMessage, setHbMessage] = useState("");
  const [hbLoading, setHbLoading] = useState(false);

  // Collapsible sections toggle state (first section open by default)
  const [openSections, setOpenSections] = useState({
    incident: true,
    incident_format: false,
    grafico: false,
    factor_tree: false,
    intervening_factors: false,
    hazard_background: false,
    contermeasure_plan: false,
    control_hierarchy: false,
    verification_method: false,
    analysis_participant: false,
    control: false,
  });

  // Local form state for demonstration and premium interactivity
  const [form, setForm] = useState({
    // Incident
    incident_folio: "",
    date: "",
    time: "",
    id_plant: "",
    level: "",
    id_area: "",
    location: "",
    id_responsible_user: "",
    id_general_sv: "",
    id_junior: "",
    incident_mechanism: "",
    injury: "",
    description: "",
    root_cause: "",
    id_cost_center: "",
    // Resto de los campos mantenidos por compatibilidad
    shift: passedIncident?.shift || "",
    status: passedIncident?.status || "abierto",
    incident_type: passedIncident?.incident_type || "",
    immediate_actions: passedIncident?.immediate_actions || "",
    classification: "",
    department: "",
    direct_supervisor: "",
    junior_manager: "",
    specific_activity: "",
    event_description: passedIncident?.description || "",
    immediate_cause: passedIncident?.incident_mechanism || "",
    system_cause: "",
    unsafe_act: "",
    unsafe_condition: "",
    human_factor: "",
    org_factor: "",
    similar_incidents: "",
    past_audits: "",
    risk_assessment_done: "",
    countermeasure: "",
    responsible_user: "",
    deadline: "",
    countermeasure_status: "",
    elimination: "",
    substitution: "",
    engineering_control: "",
    admin_control: "",
    epp: "",
    verification_type: "",
    verification_frequency: "",
    auditor_name: "",
    observation: "",
    prepared_by: "",
    reviewed_by: "",
    approved_by: "",
    approval_date: "",
    document_version: "v1.0",
  });

  useEffect(() => {
    if (currentIncidentId) {
      getIncidentById(currentIncidentId)
        .then((data) => {
          const incident = data.data || data;
          setForm(prev => ({
            ...prev,
            incident_folio: incident.incident_folio || "",
            date: incident.date ? incident.date.substring(0, 10) : "",
            time: incident.time || "",
            id_plant: incident.id_plant || "",
            level: incident.level ? String(incident.level).split(',')[0].trim() : "",
            id_area: incident.id_area || "",
            location: incident.location || "",
            id_responsible_user: incident.id_responsible_user || "",
            id_general_sv: incident.id_general_sv || "",
            id_junior: incident.id_junior || "",
            incident_mechanism: incident.incident_mechanism || "",
            injury: incident.injury || "",
            description: incident.description || "",
            root_cause: incident.root_cause || "",
            id_cost_center: incident.id_cost_center || ""
          }));
        })
        .catch(err => console.error("Error al cargar el incidente:", err));
    }
  }, [currentIncidentId]);

  const handleDeleteFactorTreeRow = async (index) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este registro del Árbol de Factores?")) return;
    const row = factorTree[index];
    if (row && row.id) {
      try {
        await deleteFactorTree(row.id);
        alert("Registro eliminado del Árbol de Factores.");
      } catch (err) {
        alert("Error al eliminar del backend: " + (err.response?.data?.error || err.message));
        return;
      }
    }
    setFactorTree(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteInterveningFactorRow = async (index) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este Factor que Interviene?")) return;
    const row = interveningFactors[index];
    if (row && row.id) {
      try {
        await deleteInterveningFactor(row.id);
        alert("Factor que Interviene eliminado.");
      } catch (err) {
        alert("Error al eliminar del backend: " + (err.response?.data?.error || err.message));
        return;
      }
    }
    setInterveningFactors(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteCountermeasurePlanRow = async (index) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este Plan de Contramedidas?")) return;
    const row = countermeasurePlan[index];
    if (row && row.id) {
      try {
        await deleteCountermeasurePlan(row.id);
        alert("Plan de Contramedidas eliminado.");
      } catch (err) {
        alert("Error al eliminar del backend: " + (err.response?.data?.error || err.message));
        return;
      }
    }
    setCountermeasurePlan(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteParticipantRow = async (index) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este Participante?")) return;
    const row = analysisParticipants[index];
    if (row && row.id) {
      try {
        await deleteAnalysisParticipant(row.id);
        alert("Participante eliminado.");
      } catch (err) {
        alert("Error al eliminar del backend: " + (err.response?.data?.error || err.message));
        return;
      }
    }
    setAnalysisParticipants(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteHazardBackground = async () => {
    if (!window.confirm("¿Está seguro de que desea eliminar los Antecedentes de Peligro o Riesgo?")) return;
    if (hazardBackground.id) {
      try {
        await deleteHazardBackground(hazardBackground.id);
        setHazardBackground({});
        alert("Antecedentes de Peligro o Riesgo eliminados.");
      } catch (err) {
        alert("Error al eliminar del backend: " + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleSaveIncident = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        incident_folio: form.incident_folio,
        date: form.date,
        time: form.time,
        id_plant: form.id_plant,
        level: form.level,
        id_area: form.id_area,
        location: form.location,
        id_responsible_user: form.id_responsible_user,
        id_general_sv: form.id_general_sv,
        id_junior: form.id_junior,
        incident_mechanism: form.incident_mechanism,
        injury: form.injury,
        description: form.description,
        root_cause: form.root_cause,
        id_cost_center: form.id_cost_center
      };

      if (currentIncidentId) {
        await updateIncident(currentIncidentId, payload);
        alert(" Incidente actualizado correctamente.");
      } else {
        const res = await createIncident(payload);
        const newId = res.data?.id_incident || res.data?.id || res.id;
        setCurrentIncidentId(newId);
        setFormData(prev => ({ ...prev, id_incident: newId }));
        alert(" Incidente creado correctamente.");
      }
    } catch (error) {
      alert(` Error al guardar el incidente: ${error?.response?.data?.error || error.message}`);
    }
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // ── Cargar Árbol de Factores en cuanto incidentFormatId esté disponible (al montar la página) ──
  useEffect(() => {
    if (!incidentFormatId) return;

    setFtLoading(true);
    getFactorTreeByIncidentFormat(incidentFormatId)
      .then((rows) => {
        if (rows && rows.length > 0) {
          const mappedRows = rows.map(row => ({
            id: row.id,
            id_incident_format: row.id_incident_format,
            "4m": row["4m"] || row.m4 || "",
            factor: row.factor || "",
            control_point: row.control_point || "",
            standard: row.standard || "",
            actual: row.actual || "",
            met_standard: row.met_standard !== null && row.met_standard !== undefined ? String(row.met_standard) : "",
            met_safety: row.met_safety !== null && row.met_safety !== undefined ? String(row.met_safety) : "",
            comments: row.comments || "",
          }));
          setFactorTree(mappedRows);
        }
      })
      .catch(() => { /* Si no hay datos previos, mantener fila vacía */ })
      .finally(() => setFtLoading(false));
  }, [incidentFormatId]);

  // ── Cargar Factores que Intervienen en cuanto incidentFormatId esté disponible (al montar la página) ──
  useEffect(() => {
    if (!incidentFormatId) return;

    setIfLoading(true);
    getInterveningFactorsByIncidentFormat(incidentFormatId)
      .then((rows) => {
        if (rows && rows.length > 0) {
          setInterveningFactors(rows);
        } else {
          setInterveningFactors([{ name: "" }]);
        }
      })
      .catch(() => {
        setInterveningFactors([{ name: "" }]);
      })
      .finally(() => setIfLoading(false));
  }, [incidentFormatId]);

  // ── Cargar Plan de Contramedidas en cuanto incidentFormatId esté disponible ──
  useEffect(() => {
    if (!incidentFormatId) return;

    setCpLoading(true);
    getCountermeasurePlanByIncidentFormat(incidentFormatId)
      .then((rows) => {
        if (rows && rows.length > 0) {
          const mapped = rows.map((r) => ({
            id: r.id,
            id_incident_format: r.id_incident_format,
            id_control_hierarchy: r.id_control_hierarchy !== null && r.id_control_hierarchy !== undefined ? String(r.id_control_hierarchy) : "",
            id_verification_method: r.id_verification_method !== null && r.id_verification_method !== undefined ? String(r.id_verification_method) : "",
            what: r.what || "",
            why: r.why || "",
            where_place: r.where_place || "",
            when_date: r.when_date ? r.when_date.substring(0, 10) : "",
            how: r.how || "",
            who: r.who || "",
            ok: r.ok !== null && r.ok !== undefined ? String(r.ok) : "",
            ng: r.ng !== null && r.ng !== undefined ? String(r.ng) : "",
            comment: r.comment || "",
          }));
          setCountermeasurePlan(mapped);
        } else {
          setCountermeasurePlan([emptyCpRow()]);
        }
      })
      .catch(() => setCountermeasurePlan([emptyCpRow()]))
      .finally(() => setCpLoading(false));
  }, [incidentFormatId]);

  // ── Cargar Antecedentes de Peligro o Riesgo en cuanto incidentFormatId esté disponible (al montar la página) ──
  useEffect(() => {
    if (!incidentFormatId) return;

    setHbLoading(true);
    getHazardBackgroundByIncidentFormat(incidentFormatId)
      .then((rows) => {
        if (rows && rows.length > 0) {
          const record = rows[0];
          setHazardBackground({
            id: record.id,
            id_incident_format: record.id_incident_format || incidentFormatId,
            previous_fr1_incidents_presented: record.previous_fr1_incidents_presented !== null && record.previous_fr1_incidents_presented !== undefined ? String(record.previous_fr1_incidents_presented) : "",
            existing_processes_or_areas_potential_for_incident: record.existing_processes_or_areas_potential_for_incident !== null && record.existing_processes_or_areas_potential_for_incident !== undefined ? String(record.existing_processes_or_areas_potential_for_incident) : "",
            processes_or_areas_potential_for_incident: record.processes_or_areas_potential_for_incident || "",
            risk_assessed_and_identified: record.risk_assessed_and_identified !== null && record.risk_assessed_and_identified !== undefined ? String(record.risk_assessed_and_identified) : "",
            incident_category: record.incident_category || "",
            horizontal_review: record.horizontal_review !== null && record.horizontal_review !== undefined ? String(record.horizontal_review) : "",
            horizontal_review_comment: record.horizontal_review_comment || "",
            new_risk_assessment_needed: record.new_risk_assessment_needed !== null && record.new_risk_assessment_needed !== undefined ? String(record.new_risk_assessment_needed) : "",
            safety_dojo_reception_date: record.safety_dojo_reception_date ? record.safety_dojo_reception_date.substring(0, 10) : "",
            genba_dojo_reception_date: record.genba_dojo_reception_date ? record.genba_dojo_reception_date.substring(0, 10) : "",
            negligence_type: record.negligence_type || "",
            labor_report: record.labor_report !== null && record.labor_report !== undefined ? String(record.labor_report) : ""
          });
        }
      })
      .catch(() => { /* Mantener estado inicial */ })
      .finally(() => setHbLoading(false));
  }, [incidentFormatId]);

  // ── Cargar Participantes en el Análisis en cuanto incidentFormatId esté disponible ──
  useEffect(() => {
    if (!incidentFormatId) return;

    setApLoading(true);
    getAnalysisParticipantsByIncidentFormat(incidentFormatId)
      .then((rows) => {
        if (rows && rows.length > 0) {
          const mapped = rows.map((r) => ({
            id: r.id,
            id_incident_format: r.id_incident_format,
            participant_type: r.participant_type || "",
            name: r.name || "",
            department: r.department || "",
            id_cost_center: r.id_cost_center !== null && r.id_cost_center !== undefined ? String(r.id_cost_center) : "",
          }));
          setAnalysisParticipants(mapped);
        } else {
          setAnalysisParticipants([emptyParticipantRow()]);
        }
      })
      .catch(() => setAnalysisParticipants([emptyParticipantRow()]))
      .finally(() => setApLoading(false));
  }, [incidentFormatId]);

  // ── Al cargar la página: obtener incident_format para extraer id_incident_format ──
  // Esto permite que el Árbol de Factores se cargue automáticamente sin abrir otras secciones
  useEffect(() => {
    if (!currentIncidentId) return;

    getIncidentFormatByIncident(currentIncidentId)
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setFormData(prev => ({ ...prev, ...data }));
          // Guardar el PK para que el useEffect de factor_tree se dispare
          if (data.id_incident_format) {
            setIncidentFormatId(data.id_incident_format);
          }
          setFormatExists(true);
        } else {
          setFormatExists(false);
        }
      })
      .catch(() => setFormatExists(false));
  }, [currentIncidentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler para campos de Datos Generales (incident_format)
  const handleIncidentFormatChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Guardar sección "Datos Generales" → POST o PUT /incident-format
  const handleSubmitIncidentFormat = async (e) => {
    e.preventDefault();
    if (!currentIncidentId) {
      alert("Primero debe crear el Reporte del Incidente para poder agregar los Datos Generales.");
      return;
    }

    setSubmitStatus(null);
    setSubmitMessage("");

    try {
      const payload = {
        id_incident: currentIncidentId,
        employee_name: formData.employee_name,
        employee_age: formData.employee_age !== "" ? Number(formData.employee_age) : null,
        employee_payroll_number: formData.employee_payroll_number,
        employee_position: formData.employee_position,
        employee_distribution: formData.employee_distribution,
        employee_seniority: formData.employee_seniority !== "" ? Number(formData.employee_seniority) : null,
        employee_seniority_in_position: formData.employee_seniority_in_position !== "" ? Number(formData.employee_seniority_in_position) : null,
        employee_type: formData.employee_type,
        accident_shift: formData.accident_shift,
        sv_seniority: formData.sv_seniority !== "" ? Number(formData.sv_seniority) : null,
        sv_seniority_in_position: formData.sv_seniority_in_position !== "" ? Number(formData.sv_seniority_in_position) : null,
        number_of_staff_under_sv: formData.number_of_staff_under_sv !== "" ? Number(formData.number_of_staff_under_sv) : null,
        attending_doctor: formData.attending_doctor,
        recovery_forecast: formData.recovery_forecast,
      };

      if (formatExists) {
        const updated = await updateIncidentFormat(currentIncidentId, payload);
        // Mantener incidentFormatId sincronizado si el backend lo devuelve
        if (updated?.id_incident_format) {
          setIncidentFormatId(updated.id_incident_format);
        }
        setSubmitStatus("success");
        setSubmitMessage(" Datos Generales actualizados correctamente.");
      } else {
        const created = await createIncidentFormat(payload);
        // Capturar el id_incident_format asignado por la base de datos
        if (created?.id_incident_format) {
          setIncidentFormatId(created.id_incident_format);
        }
        setFormatExists(true);
        setSubmitStatus("success");
        setSubmitMessage(" Datos Generales creados correctamente.");
      }
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        ` Error al guardar: ${error?.response?.data?.error || error.message}`
      );
    }
  };

  // ── Handlers de Árbol de Factores ──
  const handleFactorChange = (index, e) => {
    const { name, value } = e.target;
    setFactorTree((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [name]: value } : row))
    );
  };

  const handleAddRow = () => {
    setFactorTree((prev) => [...prev, emptyFactorRow()]);
  };

  const handleSaveFactorTree = async (e) => {
    e.preventDefault();
    // Usar incidentFormatId (estado dedicado) como fuente primaria
    const idFormat = incidentFormatId || formData.id_incident_format || formData.id;
    if (!idFormat) {
      alert("Primero debe crear y guardar los Datos Generales del Formato.");
      return;
    }

    setFtStatus(null);
    setFtMessage("");

    try {
      await Promise.all(
        factorTree.map((row) => {
          const payload = {
            id_incident_format: idFormat,
            m4: row["4m"],
            factor: row.factor,
            control_point: row.control_point,
            standard: row.standard,
            actual: row.actual,
            met_standard: row.met_standard === "" || row.met_standard === undefined || row.met_standard === null ? null : (row.met_standard === "true" || row.met_standard === true),
            met_safety: row.met_safety === "" || row.met_safety === undefined || row.met_safety === null ? null : (row.met_safety === "true" || row.met_safety === true),
            comments: row.comments,
          };
          if (row.id) {
            return updateFactorTree(row.id, payload);
          } else {
            return createFactorTree(payload);
          }
        })
      );

      // Reload the data to get the new IDs assigned
      const newRows = await getFactorTreeByIncidentFormat(idFormat);
      if (newRows && newRows.length > 0) {
        const mappedRows = newRows.map(row => ({
          id: row.id,
          id_incident_format: row.id_incident_format,
          "4m": row["4m"] || row.m4 || "",
          factor: row.factor || "",
          control_point: row.control_point || "",
          standard: row.standard || "",
          actual: row.actual || "",
          met_standard: row.met_standard !== null && row.met_standard !== undefined ? String(row.met_standard) : "",
          met_safety: row.met_safety !== null && row.met_safety !== undefined ? String(row.met_safety) : "",
          comments: row.comments || "",
        }));
        setFactorTree(mappedRows);
      }

      setFtStatus("success");
      setFtMessage(" Árbol de Factores guardado/actualizado correctamente.");
    } catch (error) {
      setFtStatus("error");
      setFtMessage(
        ` Error al guardar Árbol de Factores: ${error?.response?.data?.error || error.message}`
      );
    }
  };
  // ── Handlers de Factores que Intervienen ──
  const handleInterveningFactorChange = (index, e) => {
    const { value } = e.target;
    setInterveningFactors((prev) =>
      prev.map((row, i) => (i === index ? { ...row, name: value } : row))
    );
  };

  const handleAddInterveningFactor = () => {
    setInterveningFactors((prev) => [...prev, { name: "" }]);
  };

  const handleSaveInterveningFactors = async (e) => {
    e.preventDefault();
    const idFormat = incidentFormatId || formData.id_incident_format || formData.id;
    if (!idFormat) {
      alert("Primero debe crear y guardar los Datos Generales del Formato.");
      return;
    }

    setIfStatus(null);
    setIfMessage("");

    try {
      await Promise.all(
        interveningFactors.map((row) => {
          if (!row.name || row.name.trim() === "") return Promise.resolve();
          const payload = {
            id_incident_format: idFormat,
            name: row.name,
          };
          if (row.id) {
            return updateInterveningFactor(row.id, payload);
          } else {
            return createInterveningFactor(payload);
          }
        })
      );

      // Recargar datos actualizados
      const newRows = await getInterveningFactorsByIncidentFormat(idFormat);
      if (newRows && newRows.length > 0) {
        setInterveningFactors(newRows);
      }

      setIfStatus("success");
      setIfMessage(" Factores que Intervienen guardados correctamente.");
    } catch (error) {
      setIfStatus("error");
      setIfMessage(
        ` Error al guardar Factores que Intervienen: ${error?.response?.data?.error || error.message}`
      );
    }
  };

  // ── Handlers de Antecedentes de Peligro o Riesgo ──
  const handleHazardBackgroundChange = (e) => {
    const { name, value } = e.target;
    setHazardBackground((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveHazardBackground = async (e) => {
    e.preventDefault();
    const idFormat = incidentFormatId || formData.id_incident_format || formData.id;
    if (!idFormat) {
      alert("Primero debe crear y guardar los Datos Generales del Formato.");
      return;
    }

    setHbStatus(null);
    setHbMessage("");

    try {
      const payload = {
        id_incident_format: idFormat,
        previous_fr1_incidents_presented: hazardBackground.previous_fr1_incidents_presented === "" ? null : (hazardBackground.previous_fr1_incidents_presented === "true"),
        existing_processes_or_areas_potential_for_incident: hazardBackground.existing_processes_or_areas_potential_for_incident === "" ? null : (hazardBackground.existing_processes_or_areas_potential_for_incident === "true"),
        processes_or_areas_potential_for_incident: hazardBackground.processes_or_areas_potential_for_incident || null,
        risk_assessed_and_identified: hazardBackground.risk_assessed_and_identified === "" ? null : (hazardBackground.risk_assessed_and_identified === "true"),
        incident_category: hazardBackground.incident_category || null,
        horizontal_review: hazardBackground.horizontal_review === "" ? null : (hazardBackground.horizontal_review === "true"),
        horizontal_review_comment: hazardBackground.horizontal_review_comment || null,
        new_risk_assessment_needed: hazardBackground.new_risk_assessment_needed === "" ? null : (hazardBackground.new_risk_assessment_needed === "true"),
        safety_dojo_reception_date: hazardBackground.safety_dojo_reception_date || null,
        genba_dojo_reception_date: hazardBackground.genba_dojo_reception_date || null,
        negligence_type: hazardBackground.negligence_type || null,
        labor_report: hazardBackground.labor_report === "" ? null : (hazardBackground.labor_report === "true")
      };

      if (hazardBackground.id) {
        const updated = await updateHazardBackground(hazardBackground.id, payload);
        setHazardBackground((prev) => ({
          ...prev,
          ...updated,
          previous_fr1_incidents_presented: updated.previous_fr1_incidents_presented !== null && updated.previous_fr1_incidents_presented !== undefined ? String(updated.previous_fr1_incidents_presented) : "",
          existing_processes_or_areas_potential_for_incident: updated.existing_processes_or_areas_potential_for_incident !== null && updated.existing_processes_or_areas_potential_for_incident !== undefined ? String(updated.existing_processes_or_areas_potential_for_incident) : "",
          risk_assessed_and_identified: updated.risk_assessed_and_identified !== null && updated.risk_assessed_and_identified !== undefined ? String(updated.risk_assessed_and_identified) : "",
          horizontal_review: updated.horizontal_review !== null && updated.horizontal_review !== undefined ? String(updated.horizontal_review) : "",
          new_risk_assessment_needed: updated.new_risk_assessment_needed !== null && updated.new_risk_assessment_needed !== undefined ? String(updated.new_risk_assessment_needed) : "",
          safety_dojo_reception_date: updated.safety_dojo_reception_date ? updated.safety_dojo_reception_date.substring(0, 10) : "",
          genba_dojo_reception_date: updated.genba_dojo_reception_date ? updated.genba_dojo_reception_date.substring(0, 10) : "",
          labor_report: updated.labor_report !== null && updated.labor_report !== undefined ? String(updated.labor_report) : "",
        }));
      } else {
        const created = await createHazardBackground(payload);
        setHazardBackground((prev) => ({
          ...prev,
          ...created,
          previous_fr1_incidents_presented: created.previous_fr1_incidents_presented !== null && created.previous_fr1_incidents_presented !== undefined ? String(created.previous_fr1_incidents_presented) : "",
          existing_processes_or_areas_potential_for_incident: created.existing_processes_or_areas_potential_for_incident !== null && created.existing_processes_or_areas_potential_for_incident !== undefined ? String(created.existing_processes_or_areas_potential_for_incident) : "",
          risk_assessed_and_identified: created.risk_assessed_and_identified !== null && created.risk_assessed_and_identified !== undefined ? String(created.risk_assessed_and_identified) : "",
          horizontal_review: created.horizontal_review !== null && created.horizontal_review !== undefined ? String(created.horizontal_review) : "",
          new_risk_assessment_needed: created.new_risk_assessment_needed !== null && created.new_risk_assessment_needed !== undefined ? String(created.new_risk_assessment_needed) : "",
          safety_dojo_reception_date: created.safety_dojo_reception_date ? created.safety_dojo_reception_date.substring(0, 10) : "",
          genba_dojo_reception_date: created.genba_dojo_reception_date ? created.genba_dojo_reception_date.substring(0, 10) : "",
          labor_report: created.labor_report !== null && created.labor_report !== undefined ? String(created.labor_report) : "",
        }));
      }

      setHbStatus("success");
      setHbMessage(" Antecedentes de Peligros o Riesgos guardados correctamente.");
    } catch (error) {
      setHbStatus("error");
      setHbMessage(
        ` Error al guardar Antecedentes de Peligros o Riesgos: ${error?.response?.data?.error || error.message}`
      );
    }
  };

  // ── Handlers de Plan de Contramedidas ──
  const handleCpChange = (index, e) => {
    const { name, value } = e.target;
    setCountermeasurePlan((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [name]: value } : row))
    );
  };

  const handleAddCpRow = () => {
    setCountermeasurePlan((prev) => [...prev, emptyCpRow()]);
  };

  const handleSaveCountermeasurePlan = async (e) => {
    e.preventDefault();
    const idFormat = incidentFormatId || formData.id_incident_format || formData.id;
    if (!idFormat) {
      alert("Primero debe crear y guardar los Datos Generales del Formato.");
      return;
    }

    setCpStatus(null);
    setCpMessage("");

    try {
      await Promise.all(
        countermeasurePlan.map((row) => {
          const payload = {
            id_incident_format: idFormat,
            id_control_hierarchy: row.id_control_hierarchy !== "" ? Number(row.id_control_hierarchy) : null,
            id_verification_method: row.id_verification_method !== "" ? Number(row.id_verification_method) : null,
            what: row.what || null,
            why: row.why || null,
            where_place: row.where_place || null,
            when_date: row.when_date || null,
            how: row.how || null,
            who: row.who || null,
            ok: row.ok === "" ? null : (row.ok === "true"),
            ng: row.ng === "" ? null : (row.ng === "true"),
            comment: row.comment || null,
          };
          if (row.id) {
            return updateCountermeasurePlan(row.id, payload);
          } else {
            return createCountermeasurePlan(payload);
          }
        })
      );

      // Recargar para obtener los IDs asignados
      const newRows = await getCountermeasurePlanByIncidentFormat(idFormat);
      if (newRows && newRows.length > 0) {
        const mapped = newRows.map((r) => ({
          id: r.id,
          id_incident_format: r.id_incident_format,
          id_control_hierarchy: r.id_control_hierarchy !== null && r.id_control_hierarchy !== undefined ? String(r.id_control_hierarchy) : "",
          id_verification_method: r.id_verification_method !== null && r.id_verification_method !== undefined ? String(r.id_verification_method) : "",
          what: r.what || "",
          why: r.why || "",
          where_place: r.where_place || "",
          when_date: r.when_date ? r.when_date.substring(0, 10) : "",
          how: r.how || "",
          who: r.who || "",
          ok: r.ok !== null && r.ok !== undefined ? String(r.ok) : "",
          ng: r.ng !== null && r.ng !== undefined ? String(r.ng) : "",
          comment: r.comment || "",
        }));
        setCountermeasurePlan(mapped);
      }

      setCpStatus("success");
      setCpMessage(" Plan de Contramedidas guardado correctamente.");
    } catch (error) {
      setCpStatus("error");
      setCpMessage(
        ` Error al guardar Plan de Contramedidas: ${error?.response?.data?.error || error.message}`
      );
    }
  };

  // ── Handlers de Participantes en el Análisis ──
  const handleParticipantChange = (index, e) => {
    const { name, value } = e.target;
    setAnalysisParticipants((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [name]: value } : row))
    );
  };

  const handleAddParticipantRow = () => {
    setAnalysisParticipants((prev) => [...prev, emptyParticipantRow()]);
  };

  const handleSaveAnalysisParticipants = async (e) => {
    e.preventDefault();
    const idFormat = incidentFormatId || formData.id_incident_format || formData.id;
    if (!idFormat) {
      alert("Primero debe crear y guardar los Datos Generales del Formato.");
      return;
    }

    setApStatus(null);
    setApMessage("");

    // Filtrar filas completamente vacías
    const validRows = analysisParticipants.filter(row => row.participant_type || row.name || row.department || row.id_cost_center);

    // Evitar duplicados basados en combinación de nombre y rol (participant_type) en el frontend
    const seen = new Set();
    const uniqueRows = [];
    for (const row of validRows) {
      const key = `${row.name?.trim().toLowerCase()}_${row.participant_type?.trim().toLowerCase()}`;
      if (seen.has(key)) {
        alert(`El participante "${row.name}" con rol "${row.participant_type}" está duplicado.`);
        return;
      }
      seen.add(key);
      uniqueRows.push(row);
    }

    try {
      await Promise.all(
        uniqueRows.map((row) => {
          const payload = {
            id_incident_format: idFormat,
            participant_type: row.participant_type || null,
            name: row.name || null,
            department: row.department || null,
            id_cost_center: row.id_cost_center !== "" ? Number(row.id_cost_center) : null,
          };
          if (row.id) {
            return updateAnalysisParticipant(row.id, payload);
          } else {
            return createAnalysisParticipant(payload);
          }
        })
      );

      // Recargar datos actualizados
      const newRows = await getAnalysisParticipantsByIncidentFormat(idFormat);
      if (newRows && newRows.length > 0) {
        const mapped = newRows.map((r) => ({
          id: r.id,
          id_incident_format: r.id_incident_format,
          participant_type: r.participant_type || "",
          name: r.name || "",
          department: r.department || "",
          id_cost_center: r.id_cost_center !== null && r.id_cost_center !== undefined ? String(r.id_cost_center) : "",
        }));
        setAnalysisParticipants(mapped);
      } else {
        setAnalysisParticipants([emptyParticipantRow()]);
      }

      setApStatus("success");
      setApMessage(" Participantes en el Análisis guardados correctamente.");
    } catch (error) {
      setApStatus("error");
      setApMessage(
        ` Error al guardar Participantes: ${error?.response?.data?.error || error.message}`
      );
    }
  };

  // Demonstration save handler
  const handleDemoSave = (e) => {
    e.preventDefault();
    alert("¡Borrador guardado localmente! (Lógica de conexión lista para integración)");
  };

  const handleGenerateExcel = async (e) => {
    e.preventDefault();
    if (!currentIncidentId) {
      alert("Primero debe guardar el Reporte del Incidente para generar el Excel.");
      return;
    }
    try {
      const blob = await downloadIncidentExcel(currentIncidentId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `reporte_incidente_${currentIncidentId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al generar el formato Excel:", error);
      alert("Ocurrió un error al generar el archivo Excel. Asegúrese de que el servidor esté activo.");
    }
  };

  return (
    <div className="lfi-page animate-in">
      <div className="lfi-container">

        {/* Header Block */}
        <div className="lfi-header">
          <h1>Llenado de Formato de Incidente</h1>
          <p className="lfi-subtitle">Complete las secciones del análisis detallado de incidentes y contramedidas.</p>
        </div>

        {/* Top Control Bar */}
        <div className="lfi-top-actions glass">
          <span className="lfi-summary-badge">Borrador Local</span>
          <div className="lfi-btn-group">
            <button className="btn-secondary" onClick={() => window.history.back()}>
              Volver
            </button>
            <button className="btn-primary" onClick={handleDemoSave}>
               Guardar Borrador
            </button>
            <button className="btn-primary btn-generate-excel" onClick={handleGenerateExcel} style={{ backgroundColor: "#28a745" }}>
               Generar Formato
            </button>
          </div>
        </div>

        {/* ── 1. INCIDENT SECTION ── */}
        <div className={`lfi-card ${openSections.incident ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("incident")}>
            <span className="lfi-card-title">
            
              1. Reporte de Incidente
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.incident && (
            <div className="lfi-card-body">
              <form onSubmit={handleSaveIncident}>
                <div className="lfi-form-grid">
                  <div className="lfi-form-group">
                    <label>Folio del Incidente</label>
                    <input name="incident_folio" value={form.incident_folio} onChange={handleInputChange} placeholder="Ej. INC-2026-0042" />
                  </div>
                  <div className="lfi-form-group">
                    <label>Fecha</label>
                    <input name="date" type="date" value={form.date} onChange={handleInputChange} />
                  </div>
                  <div className="lfi-form-group">
                    <label>Hora</label>
                    <input name="time" type="time" value={form.time} onChange={handleInputChange} />
                  </div>
                  <div className="lfi-form-group">
                    <label>Planta</label>
                    <select name="id_plant" value={form.id_plant} onChange={handleInputChange}>
                      <option value="">Seleccione una planta</option>
                      {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="lfi-form-group">
                    <label>Nivel de Gravedad</label>
                    <select name="level" value={form.level} onChange={handleInputChange}>
                      <option value="">Seleccione gravedad</option>
                      <option value="G">G</option>
                      <option value="U">U</option>
                      <option value="R">R</option>
                      <option value="FR1">FR1</option>
                      <option value="FR0">FR0</option>
                    </select>
                  </div>
                  <div className="lfi-form-group">
                    <label>Área</label>
                    <select name="id_area" value={form.id_area} onChange={handleInputChange}>
                      <option value="">Seleccione un área</option>
                      {areas.map(a => <option key={a.id} value={a.id}>{a.name || a.nombre}</option>)}
                    </select>
                  </div>
                  <div className="lfi-form-group">
                    <label>Ubicación Específica</label>
                    <input name="location" value={form.location} onChange={handleInputChange} />
                  </div>
                  <div className="lfi-form-group">
                    <label>ID Usuario Responsable</label>
                    <input name="id_responsible_user" type="number" value={form.id_responsible_user} onChange={handleInputChange} />
                  </div>
                  <div className="lfi-form-group">
                    <label>ID Supervisor General</label>
                    <input name="id_general_sv" type="number" value={form.id_general_sv} onChange={handleInputChange} />
                  </div>
                  <div className="lfi-form-group">
                    <label>ID Junior</label>
                    <input name="id_junior" type="number" value={form.id_junior} onChange={handleInputChange} />
                  </div>
                  <div className="lfi-form-group">
                    <label>Centro de Costo</label>
                    <input name="id_cost_center" type="number" value={form.id_cost_center} onChange={handleInputChange} />
                  </div>
                  <div className="lfi-form-group">
                    <label>Mecanismo del Incidente</label>
                    <input name="incident_mechanism" value={form.incident_mechanism} onChange={handleInputChange} />
                  </div>
                  <div className="lfi-form-group">
                    <label>Lesión</label>
                    <input name="injury" value={form.injury} onChange={handleInputChange} />
                  </div>
                  <div className="lfi-form-group">
                    <label>Causa Raíz</label>
                    <input name="root_cause" value={form.root_cause} onChange={handleInputChange} />
                  </div>
                  <div className="lfi-form-group full-width">
                    <label>Descripción del Evento</label>
                    <textarea name="description" value={form.description} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="lfi-section-actions">
                  <button type="submit" className="btn-primary">
                    {currentIncidentId ? "Actualizar" : "Guardar"} Incidente
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── 2. INCIDENT FORMAT SECTION ── */}
        <div className={`lfi-card ${openSections.incident_format ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("incident_format")}>
            <span className="lfi-card-title">
              
              2. Datos Generales del Formato 
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.incident_format && (
            <div className="lfi-card-body">
              <form onSubmit={handleSubmitIncidentFormat}>
                <div className="lfi-form-grid">
                  {/* id_incident (solo lectura) */}
                  <div className="lfi-form-group">
                    <label>ID del Incidente</label>
                    <input
                      name="id_incident"
                      value={formData.id_incident}
                      readOnly
                      placeholder="Se asigna automáticamente"
                    />
                  </div>

                  {/* employee_name */}
                  <div className="lfi-form-group">
                    <label>Nombre del Empleado</label>
                    <input
                      name="employee_name"
                      value={formData.employee_name}
                      onChange={handleIncidentFormatChange}
                      placeholder="Nombre completo"
                    />
                  </div>

                  {/* employee_age */}
                  <div className="lfi-form-group">
                    <label>Edad del Empleado</label>
                    <input
                      name="employee_age"
                      type="number"
                      value={formData.employee_age}
                      onChange={handleIncidentFormatChange}
                      placeholder="Ej. 35"
                    />
                  </div>

                  {/* employee_payroll_number */}
                  <div className="lfi-form-group">
                    <label>Número de Nómina</label>
                    <input
                      name="employee_payroll_number"
                      value={formData.employee_payroll_number}
                      onChange={handleIncidentFormatChange}
                      placeholder="Ej. NOM-00123"
                    />
                  </div>

                  {/* employee_position */}
                  <div className="lfi-form-group">
                    <label>Puesto del Empleado</label>
                    <input
                      name="employee_position"
                      value={formData.employee_position}
                      onChange={handleIncidentFormatChange}
                      placeholder="Ej. Operador Especializado"
                    />
                  </div>

                  {/* employee_distribution */}
                  <div className="lfi-form-group">
                    <label>Distribución / Departamento</label>
                    <input
                      name="employee_distribution"
                      value={formData.employee_distribution}
                      onChange={handleIncidentFormatChange}
                      placeholder="Ej. Ensamble Planta 1"
                    />
                  </div>

                  {/* employee_seniority */}
                  <div className="lfi-form-group">
                    <label>Antigüedad en la Empresa (años)</label>
                    <input
                      name="employee_seniority"
                      type="number"
                      value={formData.employee_seniority}
                      onChange={handleIncidentFormatChange}
                      placeholder="Ej. 5"
                    />
                  </div>

                  {/* employee_seniority_in_position */}
                  <div className="lfi-form-group">
                    <label>Antigüedad en el Puesto (años)</label>
                    <input
                      name="employee_seniority_in_position"
                      type="number"
                      value={formData.employee_seniority_in_position}
                      onChange={handleIncidentFormatChange}
                      placeholder="Ej. 2"
                    />
                  </div>

                  {/* employee_type */}
                  <div className="lfi-form-group">
                    <label>Tipo de Empleado</label>
                    <select
                      name="employee_type"
                      value={formData.employee_type}
                      onChange={handleIncidentFormatChange}
                    >
                      <option value="">Seleccione tipo</option>
                      <option value="Directo">Directo</option>
                      <option value="Indirecto">Indirecto</option>
                      <option value="Contratista">Contratista</option>
                    </select>
                  </div>

                  {/* accident_shift */}
                  <div className="lfi-form-group">
                    <label>Turno del Accidente</label>
                    <select
                      name="accident_shift"
                      value={formData.accident_shift}
                      onChange={handleIncidentFormatChange}
                    >
                      <option value="">Seleccione turno</option>
                      <option value="A">Turno A (Matutino)</option>
                      <option value="B">Turno B (Vespertino)</option>
                      <option value="C">Turno C (Nocturno)</option>
                    </select>
                  </div>

                  {/* sv_seniority */}
                  <div className="lfi-form-group">
                    <label>Antigüedad del SV en la Empresa (años)</label>
                    <input
                      name="sv_seniority"
                      type="number"
                      value={formData.sv_seniority}
                      onChange={handleIncidentFormatChange}
                      placeholder="Ej. 8"
                    />
                  </div>

                  {/* sv_seniority_in_position */}
                  <div className="lfi-form-group">
                    <label>Antigüedad del SV en el Puesto (años)</label>
                    <input
                      name="sv_seniority_in_position"
                      type="number"
                      value={formData.sv_seniority_in_position}
                      onChange={handleIncidentFormatChange}
                      placeholder="Ej. 3"
                    />
                  </div>

                  {/* number_of_staff_under_sv */}
                  <div className="lfi-form-group">
                    <label>No. de Personal a Cargo del SV</label>
                    <input
                      name="number_of_staff_under_sv"
                      type="number"
                      value={formData.number_of_staff_under_sv}
                      onChange={handleIncidentFormatChange}
                      placeholder="Ej. 12"
                    />
                  </div>

                  {/* attending_doctor */}
                  <div className="lfi-form-group">
                    <label>Médico que Atendió</label>
                    <input
                      name="attending_doctor"
                      value={formData.attending_doctor}
                      onChange={handleIncidentFormatChange}
                      placeholder="Nombre del médico"
                    />
                  </div>

                  {/* recovery_forecast */}
                  <div className="lfi-form-group">
                    <label>Pronóstico de Recuperación</label>
                    <input
                      name="recovery_forecast"
                      value={formData.recovery_forecast}
                      onChange={handleIncidentFormatChange}
                      placeholder="Ej. 7 días / Alta inmediata"
                    />
                  </div>
                </div>

                {/* Mensaje de estado */}
                {submitStatus && (
                  <div
                    className={`lfi-submit-status ${submitStatus === "success" ? "lfi-status-success" : "lfi-status-error"
                      }`}
                  >
                    {submitMessage}
                  </div>
                )}

                <div className="lfi-section-actions">
                  <button type="submit" className="btn-primary">
                     Guardar Datos Generales
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── 3. INCIDENT GRAPH SECTION ── */}
        <div className={`lfi-card ${openSections.grafico ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("grafico")}>
            <span className="lfi-card-title">
               3. Gráfico del Incidente
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.grafico && (
            <div className="lfi-card-body">
              <div
                className="lfi-upload-zone"
                onClick={() => document.getElementById("lfi-file-input").click()}
              >
                <div className="lfi-upload-icon">📁</div>
                <div className="lfi-upload-text">
                  <strong>Haz clic para examinar</strong> o arrastra imágenes del incidente aquí
                </div>
                <span className="lfi-upload-btn">Seleccionar Archivo</span>
                <input
                  id="lfi-file-input"
                  type="file"
                  className="lfi-upload-input"
                  accept="image/*"
                  onChange={() => alert("Simulación: Imagen cargada temporalmente en memoria")}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 4. FACTOR TREE SECTION ── */}
        <div className={`lfi-card ${openSections.factor_tree ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("factor_tree")}>
            <span className="lfi-card-title">
              
              4. Árbol de Factores
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.factor_tree && (
            <div className="lfi-card-body">
              {ftLoading ? (
                <div className="lfi-ft-loading">Cargando registros...</div>
              ) : (
                <form onSubmit={handleSaveFactorTree}>
                  {/* Tabla de registros */}
                  <div className="lfi-ft-table-wrapper">
                    <table className="lfi-ft-table">
                      <thead>
                        <tr>
                          <th>4M</th>
                          <th>Factor</th>
                          <th>Punto de Control</th>
                          <th>Estándar</th>
                          <th>Real</th>
                          <th>Cumple Estándar</th>
                          <th>Cumple Seguridad</th>
                          <th>Comentarios</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {factorTree.map((row, idx) => (
                          <tr key={idx}>
                            {/* 4m */}
                            <td>
                              <select
                                name="4m"
                                value={row["4m"]}
                                onChange={(e) => handleFactorChange(idx, e)}
                              >
                                <option value="">--</option>
                                <option value="Mano de obra">Mano de obra</option>
                                <option value="Maquinaria">Máquinaria</option>
                                <option value="Metodo">Método</option>
                                <option value="Material">Material</option>
                              </select>
                            </td>
                            {/* factor */}
                            <td>
                              <input
                                name="factor"
                                value={row.factor}
                                onChange={(e) => handleFactorChange(idx, e)}
                                placeholder="Ej. Falta de EPP"
                              />
                            </td>
                            {/* control_point */}
                            <td>
                              <input
                                name="control_point"
                                value={row.control_point}
                                onChange={(e) => handleFactorChange(idx, e)}
                                placeholder="Punto de control"
                              />
                            </td>
                            {/* standard */}
                            <td>
                              <input
                                name="standard"
                                value={row.standard}
                                onChange={(e) => handleFactorChange(idx, e)}
                                placeholder="Estándar esperado"
                              />
                            </td>
                            {/* actual */}
                            <td>
                              <input
                                name="actual"
                                value={row.actual}
                                onChange={(e) => handleFactorChange(idx, e)}
                                placeholder="Condición real"
                              />
                            </td>
                            {/* met_standard */}
                            <td>
                              <select
                                name="met_standard"
                                value={row.met_standard}
                                onChange={(e) => handleFactorChange(idx, e)}
                              >
                                <option value="">--</option>
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                              </select>
                            </td>
                            {/* met_safety */}
                            <td>
                              <select
                                name="met_safety"
                                value={row.met_safety}
                                onChange={(e) => handleFactorChange(idx, e)}
                              >
                                <option value="">--</option>
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                              </select>
                            </td>
                            {/* comments */}
                            <td>
                              <input
                                name="comments"
                                value={row.comments}
                                onChange={(e) => handleFactorChange(idx, e)}
                                placeholder="Observaciones"
                              />
                            </td>
                            {/* Acciones */}
                            <td>
                              <button
                                type="button"
                                className="btn-danger"
                                style={{ backgroundColor: '#ff3b30', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 4px', cursor: 'pointer' }}
                                onClick={() => handleDeleteFactorTreeRow(idx)}
                              >
                                🗑️ Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Botón para agregar fila */}
                  <div className="lfi-ft-add-row">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleAddRow}
                    >
                      + Agregar Fila
                    </button>
                  </div>

                  {/* Mensaje de estado */}
                  {ftStatus && (
                    <div
                      className={`lfi-submit-status ${ftStatus === "success" ? "lfi-status-success" : "lfi-status-error"
                        }`}
                    >
                      {ftMessage}
                    </div>
                  )}

                  <div className="lfi-section-actions">
                    <button type="submit" className="btn-primary">
                     Guardar Árbol de Factores
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ── 5. INTERVENING FACTORS SECTION ── */}
        <div className={`lfi-card ${openSections.intervening_factors ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("intervening_factors")}>
            <span className="lfi-card-title">
              
              5. Factores que Intervienen 
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.intervening_factors && (
            <div className="lfi-card-body">
              {ifLoading ? (
                <div className="lfi-ft-loading">Cargando factores...</div>
              ) : (
                <form onSubmit={handleSaveInterveningFactors}>
                  <div className="lfi-form-grid">
                    {interveningFactors.map((row, idx) => (
                      <div key={idx} className="lfi-form-group full-width" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        <label>Factor #{idx + 1}</label>
                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleInterveningFactorChange(idx, e)}
                            placeholder="Ej. Acto Inseguro - Operar sin equipo de protección"
                            style={{ flexGrow: 1 }}
                          />
                          <button
                            type="button"
                            className="btn-danger"
                            style={{ backgroundColor: '#ff3b30', color: 'white', border: 'none', borderRadius: '4px', padding: '0 16px', cursor: 'pointer' }}
                            onClick={() => handleDeleteInterveningFactorRow(idx)}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botón para agregar fila */}
                  <div className="lfi-ft-add-row" style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleAddInterveningFactor}
                    >
                      + Agregar
                    </button>
                  </div>

                  {/* Mensaje de estado */}
                  {ifStatus && (
                    <div
                      className={`lfi-submit-status ${ifStatus === "success" ? "lfi-status-success" : "lfi-status-error"
                        }`}
                      style={{ marginTop: '15px' }}
                    >
                      {ifMessage}
                    </div>
                  )}

                  <div className="lfi-section-actions" style={{ marginTop: '20px' }}>
                    <button type="submit" className="btn-primary">
                      Guardar Factores que Intervienen
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ── 6. HAZARD BACKGROUND SECTION ── */}
        <div className={`lfi-card ${openSections.hazard_background ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("hazard_background")}>
            <span className="lfi-card-title">
              
              6. Antecedentes de Peligro o Riesgo 
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.hazard_background && (
            <div className="lfi-card-body">
              {hbLoading ? (
                <div className="lfi-ft-loading">Cargando antecedentes...</div>
              ) : (
                <form onSubmit={handleSaveHazardBackground}>
                  <div className="lfi-form-grid">

                    {/* previous_fr1_incidents_presented */}
                    <div className="lfi-form-group">
                      <label>¿Se han presentado incidentes FR1 previos?</label>
                      <select
                        name="previous_fr1_incidents_presented"
                        value={hazardBackground.previous_fr1_incidents_presented}
                        onChange={handleHazardBackgroundChange}
                      >
                        <option value="">--</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    {/* existing_processes_or_areas_potential_for_incident */}
                    <div className="lfi-form-group">
                      <label>¿Existen otros procesos/áreas con potencial de incidente?</label>
                      <select
                        name="existing_processes_or_areas_potential_for_incident"
                        value={hazardBackground.existing_processes_or_areas_potential_for_incident}
                        onChange={handleHazardBackgroundChange}
                      >
                        <option value="">--</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    {/* processes_or_areas_potential_for_incident */}
                    <div className="lfi-form-group">
                      <label>Procesos o áreas con potencial de incidente (Detalles)</label>
                      <input
                        name="processes_or_areas_potential_for_incident"
                        value={hazardBackground.processes_or_areas_potential_for_incident}
                        onChange={handleHazardBackgroundChange}
                        placeholder="Ej. Línea 3 ensamble, Prensa 2"
                      />
                    </div>

                    {/* risk_assessed_and_identified */}
                    <div className="lfi-form-group">
                      <label>¿El riesgo estaba evaluado e identificado?</label>
                      <select
                        name="risk_assessed_and_identified"
                        value={hazardBackground.risk_assessed_and_identified}
                        onChange={handleHazardBackgroundChange}
                      >
                        <option value="">--</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    {/* incident_category */}
                    <div className="lfi-form-group">
                      <label>Categoría del Incidente</label>
                      <input
                        name="incident_category"
                        value={hazardBackground.incident_category}
                        onChange={handleHazardBackgroundChange}
                        placeholder="Ej. Atrapamiento, Caída"
                      />
                    </div>

                    {/* horizontal_review */}
                    <div className="lfi-form-group">
                      <label>¿Requiere revisión horizontal?</label>
                      <select
                        name="horizontal_review"
                        value={hazardBackground.horizontal_review}
                        onChange={handleHazardBackgroundChange}
                      >
                        <option value="">--</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    {/* horizontal_review_comment */}
                    <div className="lfi-form-group">
                      <label>Comentario de la revisión horizontal</label>
                      <input
                        name="horizontal_review_comment"
                        value={hazardBackground.horizontal_review_comment}
                        onChange={handleHazardBackgroundChange}
                        placeholder="Observaciones de revisión horizontal"
                      />
                    </div>

                    {/* new_risk_assessment_needed */}
                    <div className="lfi-form-group">
                      <label>¿Se requiere una nueva evaluación de riesgo?</label>
                      <select
                        name="new_risk_assessment_needed"
                        value={hazardBackground.new_risk_assessment_needed}
                        onChange={handleHazardBackgroundChange}
                      >
                        <option value="">--</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    {/* safety_dojo_reception_date */}
                    <div className="lfi-form-group">
                      <label>Fecha de recepción en Safety Dojo</label>
                      <input
                        type="date"
                        name="safety_dojo_reception_date"
                        value={hazardBackground.safety_dojo_reception_date}
                        onChange={handleHazardBackgroundChange}
                      />
                    </div>

                    {/* genba_dojo_reception_date */}
                    <div className="lfi-form-group">
                      <label>Fecha de recepción en Genba Dojo</label>
                      <input
                        type="date"
                        name="genba_dojo_reception_date"
                        value={hazardBackground.genba_dojo_reception_date}
                        onChange={handleHazardBackgroundChange}
                      />
                    </div>

                    {/* negligence_type */}
                    <div className="lfi-form-group">
                      <label>Tipo de Negligencia / Desviación</label>
                      <select
                        name="negligence_type"
                        value={hazardBackground.negligence_type}
                        onChange={handleHazardBackgroundChange}
                      >
                        <option value="">--</option>
                        <option value="Negligencia consciente">Negligencia consciente</option>
                        <option value="Negligencia no consciente">Negligencia no consciente</option>
                      </select>


                    </div>

                    {/* labor_report */}
                    <div className="lfi-form-group">
                      <label>Reporte de Labor / Acta</label>
                      <select
                        name="labor_report"
                        value={hazardBackground.labor_report}
                        onChange={handleHazardBackgroundChange}
                      >
                        <option value="">--</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                  </div>

                  {/* Mensaje de estado */}
                  {hbStatus && (
                    <div
                      className={`lfi-submit-status ${hbStatus === "success" ? "lfi-status-success" : "lfi-status-error"
                        }`}
                      style={{ marginTop: '15px' }}
                    >
                      {hbMessage}
                    </div>
                  )}

                  <div className="lfi-section-actions" style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn-primary">
                      Guardar Antecedentes de Peligro o Riesgo
                    </button>
                    {hazardBackground.id && (
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ backgroundColor: '#ff3b30', color: 'white', border: 'none', borderRadius: '4px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={handleDeleteHazardBackground}
                      >
                        🗑️ Eliminar Antecedentes
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ── 7. COUNTERMEASURE PLAN SECTION ── */}
        <div className={`lfi-card ${openSections.contermeasure_plan ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("contermeasure_plan")}>
            <span className="lfi-card-title">
              
              7. Plan de Contramedidas
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.contermeasure_plan && (
            <div className="lfi-card-body">
              {cpLoading ? (
                <div className="lfi-ft-loading">Cargando plan de contramedidas...</div>
              ) : (
                <form onSubmit={handleSaveCountermeasurePlan}>
                  <div className="lfi-ft-table-wrapper">
                    <table className="lfi-ft-table">
                      <thead>
                        <tr>
                          <th>Jerarquía de Control</th>
                          <th>Método de Verificación</th>
                          <th>Qué (What)</th>
                          <th>Por qué (Why)</th>
                          <th>Dónde (Where)</th>
                          <th>Cuándo (When)</th>
                          <th>Cómo (How)</th>
                          <th>Quién (Who)</th>
                          <th>OK</th>
                          <th>NG</th>
                          <th>Comentario</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {countermeasurePlan.map((row, idx) => (
                          <tr key={idx}>
                            {/* id_control_hierarchy */}
                            <td>
                              <select
                                name="id_control_hierarchy"
                                value={row.id_control_hierarchy}
                                onChange={(e) => handleCpChange(idx, e)}
                              >
                                <option value="">--</option>
                                {controlHierarchies.map((ch) => (
                                  <option key={ch.id} value={String(ch.id)}>
                                    {ch.abbreviation ? `${ch.abbreviation} - ${ch.name}` : ch.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {/* id_verification_method */}
                            <td>
                              <select
                                name="id_verification_method"
                                value={row.id_verification_method}
                                onChange={(e) => handleCpChange(idx, e)}
                              >
                                <option value="">--</option>
                                {verificationMethods.map((vm) => (
                                  <option key={vm.id} value={String(vm.id)}>
                                    {vm.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {/* what */}
                            <td>
                              <input
                                name="what"
                                value={row.what}
                                onChange={(e) => handleCpChange(idx, e)}
                                placeholder="Qué se hará"
                              />
                            </td>
                            {/* why */}
                            <td>
                              <input
                                name="why"
                                value={row.why}
                                onChange={(e) => handleCpChange(idx, e)}
                                placeholder="Por qué"
                              />
                            </td>
                            {/* where_place */}
                            <td>
                              <input
                                name="where_place"
                                value={row.where_place}
                                onChange={(e) => handleCpChange(idx, e)}
                                placeholder="Lugar"
                              />
                            </td>
                            {/* when_date */}
                            <td>
                              <input
                                type="date"
                                name="when_date"
                                value={row.when_date}
                                onChange={(e) => handleCpChange(idx, e)}
                              />
                            </td>
                            {/* how */}
                            <td>
                              <input
                                name="how"
                                value={row.how}
                                onChange={(e) => handleCpChange(idx, e)}
                                placeholder="Cómo"
                              />
                            </td>
                            {/* who */}
                            <td>
                              <input
                                name="who"
                                value={row.who}
                                onChange={(e) => handleCpChange(idx, e)}
                                placeholder="Responsable"
                              />
                            </td>
                            {/* ok */}
                            <td>
                              <select
                                name="ok"
                                value={row.ok}
                                onChange={(e) => handleCpChange(idx, e)}
                              >
                                <option value="">--</option>
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                              </select>
                            </td>
                            {/* ng */}
                            <td>
                              <select
                                name="ng"
                                value={row.ng}
                                onChange={(e) => handleCpChange(idx, e)}
                              >
                                <option value="">--</option>
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                              </select>
                            </td>
                            {/* comment */}
                            <td>
                              <input
                                name="comment"
                                value={row.comment}
                                onChange={(e) => handleCpChange(idx, e)}
                                placeholder="Comentario"
                              />
                            </td>
                            {/* Acciones */}
                            <td>
                              <button
                                type="button"
                                className="btn-danger"
                                style={{ backgroundColor: '#ff3b30', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}
                                onClick={() => handleDeleteCountermeasurePlanRow(idx)}
                              >
                                🗑️ Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Botón agregar fila */}
                  <div className="lfi-ft-add-row">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleAddCpRow}
                    >
                      + Agregar Fila
                    </button>
                  </div>

                  {/* Mensaje de estado */}
                  {cpStatus && (
                    <div
                      className={`lfi-submit-status ${cpStatus === "success" ? "lfi-status-success" : "lfi-status-error"
                        }`}
                      style={{ marginTop: "15px" }}
                    >
                      {cpMessage}
                    </div>
                  )}

                  <div className="lfi-section-actions" style={{ marginTop: "20px" }}>
                    <button type="submit" className="btn-primary">
                      Guardar Plan de Contramedidas
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ── 8. CONTROL HIERARCHY SECTION ── */}
        <div className={`lfi-card ${openSections.control_hierarchy ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("control_hierarchy")}>
            <span className="lfi-card-title">
            
              8. Jerarquía de Controles 
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.control_hierarchy && (
            <div className="lfi-card-body">
              <div className="control-hierarchy-info-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {controlHierarchies.length === 0 ? (
                  <p style={{ color: '#888' }}>Cargando catálogo de jerarquía de controles...</p>
                ) : (
                  controlHierarchies.map((item) => (
                    <div key={item.id} className="control-hierarchy-info-item" style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderLeft: '4px solid #007aff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <strong style={{ fontSize: '1.1rem', color: '#007aff' }}>{item.abbreviation}</strong>
                      <span style={{ fontSize: '0.95rem' }}>{item.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 9. VERIFICATION METHOD SECTION ── */}
        <div className={`lfi-card ${openSections.verification_method ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("verification_method")}>
            <span className="lfi-card-title">
              
              9. Métodos de Verificación
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.verification_method && (
            <div className="lfi-card-body">
              <div className="verification-method-info-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {verificationMethods.length === 0 ? (
                  <p style={{ color: '#888' }}>Cargando catálogo de métodos de verificación...</p>
                ) : (
                  verificationMethods.map((item, idx) => (
                    <div key={item.id || idx} className="verification-method-info-item" style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderLeft: '4px solid #34c759',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div className="verification-method-badge" style={{
                        background: '#34c759',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{item.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>ID: {item.id}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 10. ANALYSIS PARTICIPANT SECTION ── */}
        <div className={`lfi-card ${openSections.analysis_participant ? "is-open" : ""}`}>
          <button className="lfi-card-header" onClick={() => toggleSection("analysis_participant")}>
            <span className="lfi-card-title">
              
              10. Participantes del Análisis 
            </span>
            <span className="lfi-card-chevron">▼</span>
          </button>
          {openSections.analysis_participant && (
            <div className="lfi-card-body">
              {apLoading ? (
                <div className="lfi-ft-loading">Cargando participantes...</div>
              ) : (
                <form onSubmit={handleSaveAnalysisParticipants}>
                  <div className="lfi-ft-table-wrapper">
                    <table className="lfi-ft-table">
                      <thead>
                        <tr>
                          <th>Tipo de Participante</th>
                          <th>Nombre</th>
                          <th>Departamento</th>
                          <th>Centro de Costos</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisParticipants.map((row, idx) => (
                          <tr key={row.id || idx}>
                            {/* participant_type */}
                            <td>
                              <select
                                name="participant_type"
                                value={row.participant_type}
                                onChange={(e) => handleParticipantChange(idx, e)}
                              >
                                <option value="">-- Seleccione --</option>
                                <option value="Participante">Participante</option>
                                <option value="Parte interesada pertinente">Parte interesada pertinente</option>
                                <option value="Representante de los trabajadores">Representante de los trabajadores</option>
                              </select>
                            </td>
                            {/* name */}
                            <td>
                              <input
                                name="name"
                                value={row.name}
                                onChange={(e) => handleParticipantChange(idx, e)}
                                placeholder="Nombre completo"
                              />
                            </td>
                            {/* department */}
                            <td>
                              <input
                                name="department"
                                value={row.department}
                                onChange={(e) => handleParticipantChange(idx, e)}
                                placeholder="Departamento"
                              />
                            </td>
                            {/* id_cost_center */}
                            <td>
                              <select
                                name="id_cost_center"
                                value={row.id_cost_center}
                                onChange={(e) => handleParticipantChange(idx, e)}
                              >
                                <option value="">Seleccione centro de costos</option>
                                {costCenters.map((cc) => (
                                  <option key={cc.id} value={String(cc.id)}>
                                    {cc.code ? `${cc.code} - ${cc.name}` : cc.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {/* Acciones */}
                            <td>
                              <button
                                type="button"
                                className="btn-danger"
                                style={{ backgroundColor: '#ff3b30', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}
                                onClick={() => handleDeleteParticipantRow(idx)}
                              >
                                🗑️ Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Botón para agregar fila */}
                  <div className="lfi-ft-add-row" style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleAddParticipantRow}
                    >
                      + Agregar Participante
                    </button>
                  </div>

                  {/* Mensaje de estado */}
                  {apStatus && (
                    <div
                      className={`lfi-submit-status ${apStatus === "success" ? "lfi-status-success" : "lfi-status-error"
                        }`}
                      style={{ marginTop: '15px' }}
                    >
                      {apMessage}
                    </div>
                  )}

                  <div className="lfi-section-actions" style={{ marginTop: '20px' }}>
                    <button type="submit" className="btn-primary">
                      Guardar Participantes
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LlenadoFormatoIncidente;
