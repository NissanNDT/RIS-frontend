import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAllIncidents, updateIncident, deleteIncident, getIncidentFormatByIncident } from "../services/incidentService";
import { getPlants, getAreas, getUsers } from "../services/findingService";
import XLSX from "xlsx-js-style";
import api from "../api/axios";
import "../App.css";
import "../styles/AdminIncidentes.css";

/* ── Catálogos ─────────────────────────────────────────────── */
const TIPO_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "Accidente con lesión", label: "Accidente con lesión" },
  { value: "Casi accidente (Near Miss)", label: "Near Miss" },
  { value: "Incidente sin lesión", label: "Sin lesión" },
  { value: "Enfermedad ocupacional", label: "Enfermedad ocupacional" },
  { value: "Daño a propiedad / equipo", label: "Daño a propiedad" },
  { value: "Derrame / Fuga", label: "Derrame / Fuga" },
  { value: "Incendio / Explosión", label: "Incendio / Explosión" },
  { value: "Otro", label: "Otro" },
];

const LEVEL_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "G", label: "G" },
  { value: "U", label: "U" },
  { value: "R", label: "R" },
  { value: "FR1", label: "FR1" },
  { value: "FR0", label: "FR0" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "abierto", label: "Abierto" },
  { value: "en investigacion", label: "En Investigación" },
  { value: "cerrado", label: "Cerrado" },
];

const STATUS_COLORS = {
  abierto: "#E53935",
  "en investigacion": "#FB8C00",
  cerrado: "#43A047",
};

const LEVEL_COLORS = {
  G: "#43A047",
  U: "#FFB300",
  R: "#FB8C00",
  FR1: "#E53935",
  FR0: "#B71C1C",
};


/* ── Helpers ───────────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtDateInput = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");

/* ════════════════════════════════════════════════════════════ */
const AdminIncidentes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (location.state) {
      if (location.state.search) setSearch(location.state.search);
      if (location.state.filterPlant) setFilterPlant(String(location.state.filterPlant));
      if (location.state.filterLevel) setFilterLevel(location.state.filterLevel);
      if (location.state.filterArea) setFilterArea(String(location.state.filterArea));
    }
  }, [location.state]);
  const [filterDate, setFilterDate] = useState("");
  const [filterPlant, setFilterPlant] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterCostCenter, setFilterCostCenter] = useState("");
  const [filteredIncidents, setFilteredIncidents] = useState([]);

  // Catalog states
  const [plants, setPlants] = useState([]);
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [svByArea, setSvByArea] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  /* fetch */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [incidentData, plantsData, areasData, usersData, costCentersRes, svByAreaRes] = await Promise.all([
        getAllIncidents(),
        getPlants().catch(() => []),
        getAreas().catch(() => []),
        getUsers().catch(() => []),
        api.get("/get/cost-center").then(r => r.data).catch(() => []),
        api.get("/get/sv-by-area").then(r => r.data).catch(() => [])
      ]);
      setIncidents(Array.isArray(incidentData) ? incidentData : incidentData.data || []);
      setPlants(plantsData);
      setAreas(areasData);
      setUsers(usersData);
      setCostCenters(costCentersRes);
      setSvByArea(Array.isArray(svByAreaRes) ? svByAreaRes : []);
    } catch {
      setError("Error al cargar incidentes y catálogos.");
    } finally {
      setLoading(false);
    }
  };

  /* Lookup helpers */
  const getPlantName = (id) => {
    if (!id) return "—";
    const plant = plants.find((p) => String(p.id) === String(id));
    return plant ? plant.name : `Planta ${id}`;
  };

  const getAreaName = (id) => {
    if (!id) return "—";
    const area = areas.find((a) => String(a.id) === String(id));
    return area ? (area.nombre ?? area.name) : `Área ${id}`;
  };

  const getUserFullName = (id) => {
    if (!id) return "—";
    const user = users.find((u) => String(u.id) === String(id));
    return user ? user.full_name : `Usuario ${id}`;
  };

  const getCostCenterName = (id) => {
    if (!id) return "—";
    const cc = costCenters.find((c) => String(c.id) === String(id));
    return cc ? (cc.name ?? cc.nombre) : `CC ${id}`;
  };

  // Normalization helper for robust string comparison (ignores case and accents)
  const normalizeStr = (str) =>
    str
      ? str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
      : "";

  /* filter effect */
  useEffect(() => {
    const s = normalizeStr(search);
    const role = localStorage.getItem("role");
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).id : null;

    // Obtener las áreas asignadas al supervisor desde la tabla sv_by_area
    let supervisorAreas = new Set();
    if (role === "Supervisor" && userId) {
      svByArea.forEach(entry => {
        if (String(entry.id_user) === String(userId) && entry.id_area) {
          supervisorAreas.add(String(entry.id_area));
        }
      });
    }

    const result = incidents.filter((i) => {
      const plantName = normalizeStr(getPlantName(i.id_plant));
      const areaName = normalizeStr(getAreaName(i.id_area));
      const location = normalizeStr(i.location);
      const description = normalizeStr(i.description);

      const matchesSearch =
        !search ||
        String(i.id).includes(s) ||
        (i.incident_folio && normalizeStr(i.incident_folio).includes(s)) ||
        location.includes(s) ||
        description.includes(s) ||
        plantName.includes(s) ||
        areaName.includes(s);

      const matchesDate = !filterDate || (i.date && i.date.includes(filterDate)) || (i.incident_date && i.incident_date.includes(filterDate));
      const matchesPlant = !filterPlant || String(i.id_plant) === String(filterPlant);
      let incidentLevels = [];
      if (Array.isArray(i.level)) {
        incidentLevels = i.level.map(l => String(l).trim());
      } else if (i.level) {
        incidentLevels = String(i.level).split(',').map(l => l.trim());
      } else if (i.severity) {
        incidentLevels = String(i.severity).split(',').map(l => l.trim());
      }
      const matchesLevel = !filterLevel || incidentLevels.includes(String(filterLevel));
      const matchesArea = !filterArea || String(i.id_area) === String(filterArea);
      const matchesCostCenter = !filterCostCenter || String(i.id_cost_center) === String(filterCostCenter);

      // Control por roles: Supervisor solo ve sus áreas asignadas; Security/Admin ven todo
      let matchesRole = true;
      if (role === "Supervisor") {
        matchesRole = supervisorAreas.has(String(i.id_area));
      }

      return matchesSearch && matchesDate && matchesPlant && matchesLevel && matchesArea && matchesCostCenter && matchesRole;
    });

    setFilteredIncidents(result);
  }, [incidents, search, filterDate, filterPlant, filterLevel, filterArea, filterCostCenter, plants, areas, svByArea]);

  /* detail modal */
  const detailItem = incidents.find((i) => (i.id || i.incident_folio) === detailId) || null;

  /* edit */
  const startEdit = (inc) => {
    setEditingId(inc.id || inc.incident_folio);
    setEditForm({
      date: fmtDateInput(inc.date),
      time: inc.time || "",
      level: inc.level || "",
      id_plant: inc.id_plant || "",
      id_area: inc.id_area || "",
      location: inc.location || "",
      incident_mechanism: inc.incident_mechanism || "",
      injury: inc.injury || "",
      description: inc.description || "",
      root_cause: inc.root_cause || "",
      id_cost_center: inc.id_cost_center || "",
    });
    setSuccessMsg("");
  };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };
  const handleEditChange = (e) => setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateIncident(editingId, editForm);
      setSuccessMsg("Incidente actualizado correctamente.");
      setEditingId(null);
      fetchData();
    } catch {
      setSuccessMsg("Error al actualizar incidente.");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const confirmDeleteIncident = (id) => {
    setIncidentToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteIncident = async () => {
    if (!incidentToDelete) return;
    setIsDeleting(true);
    try {
      await deleteIncident(incidentToDelete);
      setSuccessMsg("Incidente eliminado con éxito.");
      setShowDeleteConfirm(false);
      setIncidentToDelete(null);
      await fetchData();
    } catch (err) {
      console.error("Error deleting incident:", err);
      setError("Error al eliminar el incidente.");
    } finally {
      setIsDeleting(false);
      setTimeout(() => {
        setSuccessMsg("");
        setError("");
      }, 5000);
    }
  };

  /* ── Export to Excel ──────────────────────────────────────── */
  const handleExportAllIncidents = async () => {
    try {
      setExporting(true);
      setSuccessMsg("Obteniendo datos de formato para todos los incidentes...");

      const formatPromises = filteredIncidents.map(async (inc) => {
        try {
          const formatData = await getIncidentFormatByIncident(inc.id);
          return { incidentId: inc.id, formatData };
        } catch (err) {
          return { incidentId: inc.id, formatData: null };
        }
      });

      const formatsRes = await Promise.all(formatPromises);
      const formatsMap = {};
      formatsRes.forEach(({ incidentId, formatData }) => {
        formatsMap[incidentId] = formatData;
      });

      setSuccessMsg("Generando archivo Excel... La descarga se iniciará automáticamente.");
      setTimeout(() => setSuccessMsg(""), 3000);

      const dataToExport = filteredIncidents.map((inc) => {
        const fmt = formatsMap[inc.id] || {};
        return {
          "Folio": inc.incident_folio || "—",
          "Fecha": fmtDate(inc.date),
          "Hora": inc.time || "—",
          "Planta": getPlantName(inc.id_plant),
          "Área": getAreaName(inc.id_area),
          "Nivel": inc.level || "—",
          "Ubicación": inc.location || "—",
          "Tipo de Incidente": inc.incident_type || "—",
          "Mecanismo": inc.incident_mechanism || "—",
          "Lesión": inc.injury || "—",
          "Causa Raíz": inc.root_cause || "—",
          "Centro de Costo": getCostCenterName(inc.id_cost_center),
          "Estatus": inc.status || "abierto",
          "Responsable": getUserFullName(inc.id_responsible_user),
          "Supervisor General": getUserFullName(inc.id_general_sv),
          "Junior": getUserFullName(inc.id_junior),
          "Acciones Inmediatas": inc.immediate_actions || "—",
          "Acciones Correctivas": inc.corrective_actions || "—",
          "Empleado Nombre": fmt.employee_name || "—",
          "Empleado Edad": fmt.employee_age || "—",
          "Empleado Nómina": fmt.employee_payroll_number || "—",
          "Empleado Puesto": fmt.employee_position || "—",
          "Empleado Departamento": fmt.employee_distribution || "—",
          "Empleado Antigüedad": fmt.employee_seniority !== undefined && fmt.employee_seniority !== null ? `${fmt.employee_seniority} años` : "—",
          "Empleado Antigüedad Puesto": fmt.employee_seniority_in_position !== undefined && fmt.employee_seniority_in_position !== null ? `${fmt.employee_seniority_in_position} años` : "—",
          "Empleado Tipo": fmt.employee_type || "—",
          "Turno Accidente": fmt.accident_shift || "—",
          "Médico Atendió": fmt.attending_doctor || "—",
          "Pronóstico Recuperación": fmt.recovery_forecast || "—",
          "Antigüedad SV": fmt.sv_seniority !== undefined && fmt.sv_seniority !== null ? `${fmt.sv_seniority} años` : "—",
          "Antigüedad SV Puesto": fmt.sv_seniority_in_position !== undefined && fmt.sv_seniority_in_position !== null ? `${fmt.sv_seniority_in_position} años` : "—",
          "Personal a Cargo SV": fmt.number_of_staff_under_sv !== undefined && fmt.number_of_staff_under_sv !== null ? fmt.number_of_staff_under_sv : "—"
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      const colWidths = Object.keys(dataToExport[0] || {}).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...dataToExport.map((row) => String(row[key] || "").length)
        );
        return { wch: Math.min(maxLength + 2, 45) };
      });
      worksheet["!cols"] = colWidths;

      if (dataToExport.length > 0) {
        const lastColIndex = Object.keys(dataToExport[0]).length - 1;
        worksheet["!autofilter"] = {
          ref: XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: { r: dataToExport.length, c: lastColIndex }
          })
        };

        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
            if (!worksheet[cell_address]) continue;
            
            const cell = worksheet[cell_address];
            
            cell.s = {
              font: { name: "Segoe UI", sz: 10 },
              alignment: { vertical: "center", wrapText: true },
              border: {
                top: { style: "thin", color: { rgb: "E2E8F0" } },
                bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                left: { style: "thin", color: { rgb: "E2E8F0" } },
                right: { style: "thin", color: { rgb: "E2E8F0" } }
              }
            };

            if (R === 0) {
              cell.s.fill = { fgColor: { rgb: "1F4E79" } };
              cell.s.font = { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "FFFFFF" } };
              cell.s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
            } else {
              if (R % 2 === 0) {
                cell.s.fill = { fgColor: { rgb: "F8FAFC" } };
              }

              const centerCols = [0, 1, 2, 5, 12, 26];
              if (centerCols.includes(C)) {
                cell.s.alignment.horizontal = "center";
              } else {
                cell.s.alignment.horizontal = "left";
              }

              if (C === 12) {
                const statusVal = String(cell.v || "").toLowerCase();
                if (statusVal === "abierto") {
                  cell.s.fill = { fgColor: { rgb: "FDE8E8" } };
                  cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "9B1C1C" } };
                } else if (statusVal === "cerrado") {
                  cell.s.fill = { fgColor: { rgb: "DEF7EC" } };
                  cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "03543F" } };
                } else if (statusVal.includes("investigacion")) {
                  cell.s.fill = { fgColor: { rgb: "FEF3C7" } };
                  cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "92400E" } };
                }
              }

              if (C === 5) {
                const lvlVal = String(cell.v || "");
                cell.s.font = { name: "Segoe UI", sz: 10, bold: true };
                if (lvlVal === "G") cell.s.font.color = { rgb: "43A047" };
                else if (lvlVal === "U") cell.s.font.color = { rgb: "FFB300" };
                else if (lvlVal === "R") cell.s.font.color = { rgb: "FB8C00" };
                else if (lvlVal === "FR1" || lvlVal === "FR0") cell.s.font.color = { rgb: "E53935" };
              }

              if (C === 0) {
                cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "1F4E79" } };
              }
            }
          }
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Incidentes");

      const filename = `Incidentes_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Error exporting all incidents:", err);
      setError("Error al exportar los incidentes a Excel.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setExporting(false);
    }
  };

  const handleExportSingleIncident = async (inc) => {
    try {
      setSuccessMsg("Obteniendo datos del formato...");
      let formatData = null;
      try {
        formatData = await getIncidentFormatByIncident(inc.id);
      } catch (err) {
        console.warn("No se encontró formato para este incidente o hubo un error:", err);
      }

      setSuccessMsg("Generando archivo Excel... La descarga se iniciará automáticamente.");
      setTimeout(() => setSuccessMsg(""), 3000);

      const ws_data = [];

      // SECTION 1: DATOS DEL INCIDENTE
      ws_data.push(["DATOS DEL INCIDENTE", "", "", "", "", "", "", "", "", ""]);
      ws_data.push([
        "Folio",
        "Fecha",
        "Hora",
        "Planta",
        "Área",
        "Nivel",
        "Ubicación",
        "Tipo de Incidente",
        "Centro de Costo",
        "Estatus"
      ]);
      ws_data.push([
        inc.incident_folio || "—",
        fmtDate(inc.date),
        inc.time || "—",
        getPlantName(inc.id_plant),
        getAreaName(inc.id_area),
        inc.level || "—",
        inc.location || "—",
        inc.incident_type || "—",
        getCostCenterName(inc.id_cost_center),
        inc.status || "abierto"
      ]);

      ws_data.push([
        "Mecanismo",
        "Lesión",
        "Causa Raíz",
        "Responsable",
        "SV General",
        "Junior",
        "Acciones Inmediatas",
        "Acciones Correctivas",
        "",
        ""
      ]);
      ws_data.push([
        inc.incident_mechanism || "—",
        inc.injury || "—",
        inc.root_cause || "—",
        getUserFullName(inc.id_responsible_user),
        getUserFullName(inc.id_general_sv),
        getUserFullName(inc.id_junior),
        inc.immediate_actions || "—",
        inc.corrective_actions || "—",
        "",
        ""
      ]);

      ws_data.push([]);
      ws_data.push([]);

      // SECTION 2: DATOS DEL FORMATO DE DETALLE
      ws_data.push(["DATOS DEL FORMATO DE INCIDENTE", "", "", "", "", "", "", "", "", ""]);
      ws_data.push([
        "Nombre Empleado",
        "Edad",
        "Número Nómina",
        "Puesto",
        "Departamento",
        "Antigüedad",
        "Antigüedad Puesto",
        "Tipo Empleado",
        "Turno",
        "Médico Atendió"
      ]);

      if (formatData) {
        ws_data.push([
          formatData.employee_name || "—",
          formatData.employee_age || "—",
          formatData.employee_payroll_number || "—",
          formatData.employee_position || "—",
          formatData.employee_distribution || "—",
          formatData.employee_seniority !== null ? `${formatData.employee_seniority} años` : "—",
          formatData.employee_seniority_in_position !== null ? `${formatData.employee_seniority_in_position} años` : "—",
          formatData.employee_type || "—",
          formatData.accident_shift || "—",
          formatData.attending_doctor || "—"
        ]);

        ws_data.push([
          "Antigüedad SV",
          "Antigüedad SV en Puesto",
          "Personal a Cargo SV",
          "Pronóstico Recuperación",
          "",
          "",
          "",
          "",
          "",
          ""
        ]);
        ws_data.push([
          formatData.sv_seniority !== null ? `${formatData.sv_seniority} años` : "—",
          formatData.sv_seniority_in_position !== null ? `${formatData.sv_seniority_in_position} años` : "—",
          formatData.number_of_staff_under_sv !== null ? formatData.number_of_staff_under_sv : "—",
          formatData.recovery_forecast || "—",
          "",
          "",
          "",
          "",
          "",
          ""
        ]);
      } else {
        ws_data.push(["No se ha completado el formato detallado para este incidente.", "", "", "", "", "", "", "", "", ""]);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(ws_data);

      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        { s: { r: 7, c: 0 }, e: { r: 7, c: 9 } }
      ];
      if (!formatData) {
        worksheet["!merges"].push({ s: { r: 9, c: 0 }, e: { r: 9, c: 9 } });
      }

      const colWidths = Array(10).fill(null).map((_, colIdx) => {
        let maxLen = 10;
        ws_data.forEach((row, rowIdx) => {
          if (rowIdx === 0 || rowIdx === 7) return;
          const val = row[colIdx];
          if (val) maxLen = Math.max(maxLen, String(val).length);
        });
        return { wch: Math.min(maxLen + 3, 40) };
      });
      worksheet["!cols"] = colWidths;

      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      const baseBorder = {
        top: { style: "thin", color: { rgb: "E2E8F0" } },
        bottom: { style: "thin", color: { rgb: "E2E8F0" } },
        left: { style: "thin", color: { rgb: "E2E8F0" } },
        right: { style: "thin", color: { rgb: "E2E8F0" } }
      };

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cell_address]) continue;
          const cell = worksheet[cell_address];

          cell.s = {
            font: { name: "Segoe UI", sz: 10 },
            alignment: { vertical: "center", wrapText: true },
            border: baseBorder
          };

          if (R === 0 || R === 7) {
            cell.s.fill = { fgColor: { rgb: "1F4E79" } };
            cell.s.font = { name: "Segoe UI", sz: 12, bold: true, color: { rgb: "FFFFFF" } };
            cell.s.alignment = { horizontal: "center", vertical: "center" };
            cell.s.border = {};
          } 
          else if (R === 1 || R === 3 || R === 8 || R === 10) {
            cell.s.fill = { fgColor: { rgb: "F1F5F9" } };
            cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "334155" } };
            cell.s.alignment.horizontal = "center";
          }
          else if (R === 2 || R === 4 || R === 9 || R === 11) {
            if (R === 4 || R === 11) {
              cell.s.fill = { fgColor: { rgb: "F8FAFC" } };
            }
            
            const centerCols = [0, 1, 2, 5, 8, 9];
            if (centerCols.includes(C)) {
              cell.s.alignment.horizontal = "center";
            } else {
              cell.s.alignment.horizontal = "left";
            }

            if (R === 2 && C === 9) {
              const statusVal = String(cell.v || "").toLowerCase();
              if (statusVal === "abierto") {
                cell.s.fill = { fgColor: { rgb: "FDE8E8" } };
                cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "9B1C1C" } };
              } else if (statusVal === "cerrado") {
                cell.s.fill = { fgColor: { rgb: "DEF7EC" } };
                cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "03543F" } };
              } else if (statusVal.includes("investigacion")) {
                cell.s.fill = { fgColor: { rgb: "FEF3C7" } };
                cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "92400E" } };
              }
            }

            if (R === 2 && C === 5) {
              const lvlVal = String(cell.v || "");
              cell.s.font = { name: "Segoe UI", sz: 10, bold: true };
              if (lvlVal === "G") cell.s.font.color = { rgb: "43A047" };
              else if (lvlVal === "U") cell.s.font.color = { rgb: "FFB300" };
              else if (lvlVal === "R") cell.s.font.color = { rgb: "FB8C00" };
              else if (lvlVal === "FR1" || lvlVal === "FR0") cell.s.font.color = { rgb: "E53935" };
            }

            if (R === 2 && C === 0) {
              cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "1F4E79" } };
            }
          }
          else if (R === 9 && !formatData) {
            cell.s.font = { name: "Segoe UI", sz: 10, italic: true, color: { rgb: "64748B" } };
            cell.s.alignment.horizontal = "center";
          }
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Detalle Incidente");

      const filename = `Incidente_${inc.incident_folio || inc.id}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Error exporting incident details:", err);
      setError("Error al generar la exportación del incidente.");
      setTimeout(() => setError(""), 5000);
    }
  };

  /* ── PDF / Print ─────────────────────────────────────────── */
  const printIncident = (inc) => {
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte de Incidente #${inc.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;color:#111;background:#fff;padding:24px}
    .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #C8102E;padding-bottom:14px;margin-bottom:20px}
    .header-left h1{font-size:16pt;font-weight:800;color:#C8102E;letter-spacing:-0.5px}
    .header-left p{font-size:8.5pt;color:#555;margin-top:2px}
    .header-right{text-align:right;font-size:8.5pt;color:#555}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;color:#fff;font-size:8pt;font-weight:700}
    .section{margin-bottom:18px}
    .section-title{font-size:10pt;font-weight:700;color:#C8102E;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:10px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .grid-2{grid-template-columns:repeat(2,1fr)}
    .field{background:#f8f8f8;border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px}
    .field-label{font-size:7.5pt;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
    .field-value{font-size:9.5pt;font-weight:500;color:#111}
    .full{grid-column:1/-1}
    .footer{margin-top:24px;border-top:1px solid #eee;padding-top:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
    .sign-box{text-align:center}
    .sign-line{border-top:1px solid #333;margin-top:36px;padding-top:6px;font-size:8pt;color:#555}
    .watermark{position:fixed;bottom:24px;right:24px;font-size:7pt;color:#ccc}
    @media print{.no-print{display:none}}
  </style>
</head>
<body>
<div class="header">
  <div class="header-left">
    <h1>🚨 Reporte de Incidente de Seguridad</h1>
    <p>Sistema RIS — Nissan Motor de México</p>
  </div>
  <div class="header-right">
    <strong>Folio: INC-${String(inc.id).padStart(4, "0")}</strong><br/>
    Generado: ${new Date().toLocaleString("es-MX")}<br/>
    <span class="badge" style="background:${LEVEL_COLORS[inc.level] || '#888'};margin-top:4px">${inc.level || "—"}</span>
    &nbsp;
    <span class="badge" style="background:${STATUS_COLORS[inc.status] || '#888'}">${inc.status || "—"}</span>
  </div>
</div>

<div class="section">
  <div class="section-title">📍 Identificación del Incidente</div>
  <div class="grid">
    <div class="field"><div class="field-label">Planta</div><div class="field-value">${inc.id_plant || "—"}</div></div>
    <div class="field"><div class="field-label">Área</div><div class="field-value">${inc.id_area || "—"}</div></div>
    <div class="field"><div class="field-label">Turno</div><div class="field-value">${inc.shift || "—"}</div></div>
    <div class="field"><div class="field-label">Fecha</div><div class="field-value">${inc.incident_date || "—"}</div></div>
    <div class="field"><div class="field-label">Hora</div><div class="field-value">${inc.incident_time || "—"}</div></div>
    <div class="field"><div class="field-label">Lugar / Equipo</div><div class="field-value">${inc.location || "—"}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">📋 Descripción del Incidente</div>
  <div class="grid">
    <div class="field"><div class="field-label">Tipo de Incidente</div><div class="field-value">${inc.incident_type || "—"}</div></div>
    <div class="field"><div class="field-label">Causa Inmediata</div><div class="field-value">${inc.immediate_cause || "—"}</div></div>
    <div class="field"><div class="field-label">Parte del Cuerpo</div><div class="field-value">${inc.body_part_affected || "—"}</div></div>
    <div class="field full"><div class="field-label">Descripción Detallada</div><div class="field-value">${inc.description || "—"}</div></div>
    <div class="field full"><div class="field-label">Testigos</div><div class="field-value">${inc.witnesses || "—"}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">🛠️ Respuesta y Seguimiento</div>
  <div class="grid grid-2">
    <div class="field"><div class="field-label">Acciones Inmediatas</div><div class="field-value">${inc.immediate_actions || "—"}</div></div>
    <div class="field"><div class="field-label">Acciones Correctivas / Preventivas</div><div class="field-value">${inc.corrective_actions || "—"}</div></div>
    <div class="field"><div class="field-label">Responsable de Seguimiento</div><div class="field-value">${inc.id_responsible_user || "—"}</div></div>
    <div class="field"><div class="field-label">Fecha Límite de Seguimiento</div><div class="field-value">${inc.follow_up_date || "—"}</div></div>
  </div>
</div>

<div class="footer">
  <div class="sign-box"><div class="sign-line">Reportó</div></div>
  <div class="sign-box"><div class="sign-line">Supervisor / Jefe de Área</div></div>
  <div class="sign-box"><div class="sign-line">Seguridad Industrial</div></div>
</div>

<div class="watermark">RIS v1.0 — Nissan Motor de México</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`);
    win.document.close();
  };

  const goToForm = () => window.location.href = "/reporteIncidente";

  return (
    <div className="admin-page">
      <div className="admin-container">

        {/* Header */}
        <div className="ai-header animate-in">
          <div>
            <h1>Administración de Incidentes</h1>
            <p className="ai-subtitle">Gestiona, investiga y da seguimiento a todos los incidentes registrados.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleExportAllIncidents}
              className="btn-save animate-in"
              disabled={filteredIncidents.length === 0 || exporting}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'linear-gradient(135deg, #1D6F42, #105B34)', 
                border: 'none',
                padding: '10px 20px',
              }}
            >
              {exporting ? "Exportando..." : "📥 Exportar a Excel"}
            </button>
            <button id="ai-btn-new" className="ai-btn-new" onClick={goToForm}>
              + Nuevo Reporte
            </button>
          </div>
        </div>

        {/* Success */}
        {successMsg && <div className="admin-success animate-in">{successMsg}</div>}

        {/* Filters */}
        <div className="admin-filters animate-in animate-in-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div className="filter-group">
            <label htmlFor="ai-search">Buscar</label>
            <input id="ai-search" type="text" placeholder="ID, ubicación, desc…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-group">
            <label htmlFor="ai-filter-date">Fecha</label>
            <input id="ai-filter-date" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          {role !== "Supervisor" && (
            <>
              <div className="filter-group">
                <label htmlFor="ai-filter-plant">Planta</label>
                <select id="ai-filter-plant" value={filterPlant} onChange={(e) => setFilterPlant(e.target.value)}>
                  <option value="">Todas</option>
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="ai-filter-area">Área</label>
                <select id="ai-filter-area" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                  <option value="">Todas</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name || a.nombre}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="filter-group">
            <label htmlFor="ai-filter-level">Nivel</label>
            <select id="ai-filter-level" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="ai-filter-cost">C. Costo</label>
            <select id="ai-filter-cost" value={filterCostCenter} onChange={(e) => setFilterCostCenter(e.target.value)}>
              <option value="">Todos</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>{cc.name || cc.nombre}</option>
              ))}
            </select>
          </div>
          <div className="filter-group filter-count" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="count-badge">{filteredIncidents.length}</span>
            <span>resultados</span>
          </div>
        </div>

        {loading && <div className="admin-loading">Cargando incidentes…</div>}

        {!loading && (
          <div className="admin-table-wrapper animate-in animate-in-delay-2">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha y Hora</th>
                  <th>Planta / Área</th>
                  <th>Nivel</th>
                  <th>Ubicación</th>
                  <th>Involucrados</th>
                  <th>Mecanismo / Lesión</th>
                  <th>Descripción / Causa Raíz</th>
                  <th>C. Costo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length === 0 ? (
                  <tr><td colSpan="10" className="admin-empty">No se encontraron incidentes</td></tr>
                ) : filteredIncidents.map((inc) => (
                  <tr key={inc.id || inc.incident_folio} className={editingId === (inc.id || inc.incident_folio) ? "row-editing" : ""}>
                    <td className="cell-id">{inc.incident_folio || "—"}</td>
                    <td>{fmtDate(inc.date)}<br /><small className="ai-time">{inc.time}</small></td>
                    <td>
                      <span className="ai-plant">{getPlantName(inc.id_plant)}</span><br />
                      <small>{getAreaName(inc.id_area)}</small>
                    </td>
                    <td>
                      <span className="status-badge" style={{ background: LEVEL_COLORS[inc.level] || "#888" }}>
                        {inc.level || "—"}
                      </span>
                    </td>
                    <td>{inc.location || "—"}</td>
                    <td>
                      <small><strong>Resp:</strong> {getUserFullName(inc.id_responsible_user)}</small><br />
                      <small><strong>SV:</strong> {getUserFullName(inc.id_general_sv)}</small><br />
                      <small><strong>Jr:</strong> {getUserFullName(inc.id_junior)}</small>
                    </td>
                    <td>
                      <small><strong>Mec:</strong> {inc.incident_mechanism || "—"}</small><br />
                      <small><strong>Les:</strong> {inc.injury || "—"}</small>
                    </td>
                    <td className="cell-desc">
                      <div style={{ maxHeight: '60px', overflowY: 'auto' }}>
                        <small><strong>Desc:</strong> {inc.description || "—"}</small><br />
                        <small><strong>Causa:</strong> {inc.root_cause || "—"}</small>
                      </div>
                    </td>
                    <td>{getCostCenterName(inc.id_cost_center)}</td>
                    <td>
                      <div className="ai-action-btns">
                        <button className="btn-edit" onClick={() => setDetailId(inc.id || inc.incident_folio)} title="Ver detalle">👁️</button>
                        <button className="btn-edit" onClick={() => startEdit(inc)} title="Editar">✏️</button>
                        <button className="btn-edit ai-btn-print" onClick={() => printIncident(inc)} title="Generar formato">🖨️</button>
                        <button
                          className="btn-edit"
                          style={{ backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', border: '1px solid rgba(200, 16, 46, 0.2)' }}
                          onClick={() => {
                            navigate("/llenadoFormatoIncidente", {
                              state: { incident: inc },
                            });
                          }}
                          title="Ver Formato"
                        >
                          📄 Formato
                        </button>
                        <button
                          className="btn-edit"
                          style={{ backgroundColor: 'rgba(29, 111, 66, 0.1)', color: '#1D6F42', border: '1px solid rgba(29, 111, 66, 0.2)' }}
                          onClick={() => handleExportSingleIncident(inc)}
                          title="Exportar a Excel"
                        >
                          📥 Excel
                        </button>
                        {role === "Admin" && (
                          <button
                            className="btn-edit"
                            style={{ backgroundColor: 'rgba(229, 57, 53, 0.1)', color: '#E53935', border: '1px solid rgba(229, 57, 53, 0.2)' }}
                            onClick={() => confirmDeleteIncident(inc.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <div className="popup" onClick={() => setDetailId(null)}>
          <div className="ai-detail-modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="ai-detail-header">
              <div>
                <h2>{detailItem.incident_folio || `INC-${String(detailItem.id).padStart(4, "0")}`}</h2>
                <p>{detailItem.location}</p>
              </div>
              <div className="ai-detail-badges">
                <span className="status-badge" style={{ background: LEVEL_COLORS[detailItem.level] || "#888" }}>
                  {detailItem.level}
                </span>
                <span className="status-badge" style={{ background: STATUS_COLORS[detailItem.status] || "#888" }}>
                  {detailItem.status}
                </span>
              </div>
            </div>

            <div className="ai-detail-grid">
              {[
                ["Planta", getPlantName(detailItem.id_plant)],
                ["Área", getAreaName(detailItem.id_area)],
                ["Fecha", fmtDate(detailItem.date)],
                ["Hora", detailItem.time],
                ["Ubicación", detailItem.location],
                ["Mecanismo", detailItem.incident_mechanism],
                ["Lesión", detailItem.injury],
                ["Responsable", getUserFullName(detailItem.id_responsible_user)],
                ["SV General", getUserFullName(detailItem.id_general_sv)],
                ["Junior", getUserFullName(detailItem.id_junior)],
                ["Centro de Costo", getCostCenterName(detailItem.id_cost_center)],
              ].map(([label, value]) => (
                <div key={label} className="ai-detail-field">
                  <span className="ai-detail-label">{label}</span>
                  <span className="ai-detail-value">{value || "—"}</span>
                </div>
              ))}
              <div className="ai-detail-field ai-detail-full">
                <span className="ai-detail-label">Descripción</span>
                <span className="ai-detail-value">{detailItem.description || "—"}</span>
              </div>
              <div className="ai-detail-field ai-detail-full">
                <span className="ai-detail-label">Causa Raíz</span>
                <span className="ai-detail-value">{detailItem.root_cause || "—"}</span>
              </div>
            </div>

            <div className="ai-detail-footer">
              <button className="btn-edit ai-btn-print" onClick={() => printIncident(detailItem)}>
                🖨️ Generar Formato
              </button>
              <button 
                className="btn-edit" 
                style={{ backgroundColor: 'rgba(29, 111, 66, 0.1)', color: '#1D6F42', border: '1px solid rgba(29, 111, 66, 0.2)' }}
                onClick={() => handleExportSingleIncident(detailItem)}
              >
                📥 Exportar Excel
              </button>
              <button className="btn-cancel" onClick={() => setDetailId(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="popup" onClick={cancelEdit}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Incidente INC-{String(editingId).padStart(4, "0")}</h2>
              <button className="btn-close" onClick={cancelEdit}>&times;</button>
            </div>
            <form onSubmit={saveEdit}>
              <div className="modal-body">
                <div className="audit-form-grid">
                  <div className="form-group">
                    <label>Fecha</label>
                    <input type="date" name="date" value={editForm.date} onChange={handleEditChange} required />
                  </div>
                  <div className="form-group">
                    <label>Hora</label>
                    <input type="time" name="time" value={editForm.time} onChange={handleEditChange} required />
                  </div>
                  <div className="form-group">
                    <label>Nivel</label>
                    <select name="level" value={editForm.level} onChange={handleEditChange} required>
                      <option value="">Seleccione nivel</option>
                      {LEVEL_OPTIONS.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Planta</label>
                    <select name="id_plant" value={editForm.id_plant} onChange={handleEditChange} required>
                      <option value="">Seleccione planta</option>
                      {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Área</label>
                    <select name="id_area" value={editForm.id_area} onChange={handleEditChange} required>
                      <option value="">Seleccione área</option>
                      {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre || a.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ubicación</label>
                    <input type="text" name="location" value={editForm.location} onChange={handleEditChange} required />
                  </div>
                  <div className="form-group">
                    <label>Mecanismo</label>
                    <input type="text" name="incident_mechanism" value={editForm.incident_mechanism} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>Lesión</label>
                    <input type="text" name="injury" value={editForm.injury} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>Centro de Costo</label>
                    <select name="id_cost_center" value={editForm.id_cost_center} onChange={handleEditChange} required>
                      <option value="">Seleccione centro de costo</option>
                      {costCenters.map((cc) => <option key={cc.id} value={cc.id}>{cc.name || cc.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción</label>
                    <textarea name="description" value={editForm.description} onChange={handleEditChange} rows={2} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Causa Raíz</label>
                    <textarea name="root_cause" value={editForm.root_cause} onChange={handleEditChange} rows={2} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={cancelEdit}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : "💾 Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Incident Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="popup" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content glass" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="btn-close" onClick={() => setShowDeleteConfirm(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                ¿Estás seguro de eliminar este incidente? Esta acción también eliminará permanentemente el formato de incidente y todos sus registros relacionados.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                  Cancelar
                </button>
                <button
                  className="btn-save"
                  style={{ background: '#E53935', color: 'white' }}
                  onClick={handleDeleteIncident}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Eliminando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIncidentes;
