import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getAuditById
} from "../services/auditService";
import { 
  getPlants, 
  getAreas, 
  getUsers,
  createFinding, 
  updateFinding,
  getFindingsByAuditId,
  deleteFinding
} from "../services/findingService";
import FindingImage from "../components/FindingImage";
import { uploadImage, deleteImage, getSignedImageUrl } from "../utils/supabaseStorage";
import "../styles/Auditorias.css";

const DEMO_AUDITS = [
  {
    id: 1,
    name: "Auditoría de Seguridad Trimestral - Planta A1",
    audit_folio: "SES-1-ENSAMBLE-001",
    id_plant: 1,
    id_area: 101,
    type: "SES",
    created_at: new Date().toISOString(),
    id_audit_user: 10
  }
];

const DEMO_FINDINGS = [
  {
    id: 1,
    description: "Extintor con carga vencida en pasillo principal.",
    location: "Pasillo A3",
    finding_category: "Condición Insegura",
    status: "Abierto",
    id_audit: 1
  }
];

const DetalleAuditoria = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const role = localStorage.getItem("role") || "";
  
  const [audit, setAudit] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState([]);
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Modals
  const [showAddFindingModal, setShowAddFindingModal] = useState(false);
  const [showEditFindingModal, setShowEditFindingModal] = useState(false);

  // Forms
  const [auditForm, setAuditForm] = useState({});
  const [findingForm, setFindingForm] = useState({
    description: "",
    location: "",
    level: "A",
    reference_to_the_standard: "",
    finding_category: "Condición Insegura"
  });
  const [editFindingForm, setEditFindingForm] = useState({});
  const [selectedFindingId, setSelectedFindingId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [findingToDelete, setFindingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Image states
  const [editFindingPreview, setEditFindingPreview] = useState("");
  const [editCountermeasurePreview, setEditCountermeasurePreview] = useState("");
  const [uploadingFinding, setUploadingFinding] = useState(false);
  const [uploadingCountermeasure, setUploadingCountermeasure] = useState(false);

  // Bulk actions states
  const [selectedFindings, setSelectedFindings] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkErrorMsg, setBulkErrorMsg] = useState("");
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(""); // "Enviar", "Cerrar", "Rechazar"

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditData, findingsData, plantsData, areasData, usersData] = await Promise.all([
        getAuditById(id),
        getFindingsByAuditId(id),
        getPlants(),
        getAreas(),
        getUsers().catch(() => [])
      ]);
      
      const currentAudit = auditData || DEMO_AUDITS.find(a => String(a.id) === String(id));
      setAudit(currentAudit);
      setFindings(findingsData.length > 0 ? findingsData : DEMO_FINDINGS.filter(f => String(f.id_audit) === String(id)));
      setPlants(plantsData);
      setAreas(areasData);
      setUsers(usersData);
      
      // Init edit form
      if (currentAudit) {
        setAuditForm({
          name: currentAudit.name,
          id_plant: currentAudit.id_plant,
          id_area: currentAudit.id_area,
          type: currentAudit.type
        });
      }
    } catch (err) {
      console.error("Error fetching audit details:", err);
      const demoA = DEMO_AUDITS.find(a => String(a.id) === String(id));
      if (demoA) {
        setAudit(demoA);
        setAuditForm({ name: demoA.name, id_plant: demoA.id_plant, id_area: demoA.id_area, type: demoA.type });
        setFindings(DEMO_FINDINGS.filter(f => String(f.id_audit) === String(id)));
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserFullName = (id) => {
    if (!id) return "—";
    const user = users.find((u) => String(u.id) === String(id));
    return user ? user.full_name : `Usuario ${id}`;
  };

  const handleToggleStatus = async (finding) => {
    const newStatus = finding.status === "En revisión" ? "Abierto" : "En revisión";
    
    // Update local state first
    setFindings(prev => prev.map(f => f.id === finding.id ? { ...f, status: newStatus } : f));
    
    // Call update API
    try {
      await updateFinding(finding.id, { status: newStatus });
    } catch (err) {
      console.error("Error updating finding status:", err);
    }
  };

  const eligibleVisibleFindings = useMemo(() => {
    return findings.filter((f) => {
      if (role === "Supervisor") {
        return f.status?.toLowerCase() === "abierto";
      }
      if (role === "Security") {
        return true;
      }
      return false;
    });
  }, [findings, role]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const toAdd = eligibleVisibleFindings.map(f => f.id);
      setSelectedFindings(prev => {
        const next = new Set(prev);
        toAdd.forEach(id => next.add(id));
        return Array.from(next);
      });
    } else {
      const toRemove = new Set(eligibleVisibleFindings.map(f => f.id));
      setSelectedFindings(prev => prev.filter(id => !toRemove.has(id)));
    }
  };

  const handleSelectIndividual = (id) => {
    setSelectedFindings(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const openConfirmModal = (type) => {
    setActionType(type);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    setShowConfirmModal(false);
    let statusValue = "";
    if (actionType === "Enviar") statusValue = "En revisión";
    else if (actionType === "Cerrar") statusValue = "Cerrado";
    else if (actionType === "Rechazar") statusValue = "Rechazado";

    if (!statusValue) return;
    await handleBulkAction(statusValue);
  };

  const handleBulkAction = async (statusValue) => {
    if (selectedFindings.length === 0) return;
    setBulkProcessing(true);
    setBulkErrorMsg("");
    setBulkSuccessMsg("");

    const targetStatus = statusValue;
    const selectedEligible = findings.filter(
      (f) => selectedFindings.includes(f.id) && (role === "Security" || (role === "Supervisor" && f.status?.toLowerCase() === "abierto"))
    );

    const promises = selectedEligible.map(async (finding) => {
      const payload = {
        status: targetStatus,
      };
      if (statusValue.toLowerCase() === "cerrado") {
        payload.conclusion_date = new Date().toISOString().split("T")[0];
      }
      await updateFinding(finding.id, payload);
    });

    try {
      const results = await Promise.allSettled(promises);
      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;

      if (failures === 0) {
        setBulkSuccessMsg(`Se actualizaron correctamente ${successes} hallazgo(s) a "${statusValue}".`);
      } else {
        setBulkErrorMsg(
          `Acción completada con errores. Éxitos: ${successes}, Errores: ${failures}.`
        );
      }

      setSelectedFindings([]);
      const updatedFindings = await getFindingsByAuditId(id);
      setFindings(updatedFindings.length > 0 ? updatedFindings : DEMO_FINDINGS.filter(f => String(f.id_audit) === String(id)));
    } catch (err) {
      console.error("Error running bulk actions:", err);
      setBulkErrorMsg("Error inesperado al ejecutar las acciones masivas.");
    } finally {
      setBulkProcessing(false);
      setTimeout(() => {
        setBulkSuccessMsg("");
        setBulkErrorMsg("");
      }, 5000);
    }
  };

  const printAudit = () => {
    if (!audit) return;
    const plantName = plants.find(p => p.id === audit.id_plant)?.name || audit.id_plant;
    const areaName = areas.find(a => a.id === audit.id_area)?.name || audit.id_area;
    const responsibleName = getUserFullName(audit.id_responsible_user || audit.id_audit_user);

    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Formato de Auditoría — ${audit.audit_folio || audit.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;color:#111;background:#fff;padding:24px}
    .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #C8102E;padding-bottom:14px;margin-bottom:20px}
    .header-left h1{font-size:16pt;font-weight:800;color:#C8102E;letter-spacing:-0.5px}
    .header-left p{font-size:8.5pt;color:#555;margin-top:2px}
    .header-right{text-align:right;font-size:8.5pt;color:#555}
    .section{margin-bottom:18px}
    .section-title{font-size:10pt;font-weight:700;color:#C8102E;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:10px}
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
    .field{background:#f8f8f8;border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px}
    .field-label{font-size:7.5pt;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
    .field-value{font-size:9.5pt;font-weight:500;color:#111}
    .table-findings{width:100%;border-collapse:collapse;margin-top:10px}
    .table-findings th, .table-findings td{border:1px solid #e8e8e8;padding:8px 10px;text-align:left}
    .table-findings th{background:#f8f8f8;font-size:8pt;font-weight:700;color:#555;text-transform:uppercase}
    .table-findings td{font-size:9pt}
    .badge{display:inline-block;padding:2px 6px;border-radius:4px;color:#fff;font-size:8pt;font-weight:700}
    .footer{margin-top:40px;border-top:1px solid #eee;padding-top:14px;display:grid;grid-template-columns:repeat(2,1fr);gap:24px}
    .sign-box{text-align:center}
    .sign-line{border-top:1px solid #333;margin-top:36px;padding-top:6px;font-size:8pt;color:#555}
    .watermark{position:fixed;bottom:24px;right:24px;font-size:7pt;color:#ccc}
    @media print{.no-print{display:none}}
  </style>
</head>
<body>
<div class="header">
  <div class="header-left">
    <h1>📋 Formato de Auditoría de Seguridad</h1>
    <p>Sistema RIS — Nissan Motor de México</p>
  </div>
  <div class="header-right">
    <strong>Folio: ${audit.audit_folio || "—"}</strong><br/>
    Generado: ${new Date().toLocaleString("es-MX")}
  </div>
</div>

<div class="section">
  <div class="section-title">📍 Datos Generales de la Auditoría</div>
  <div class="grid">
    <div class="field"><div class="field-label">Nombre de Auditoría</div><div class="field-value">${audit.name || "—"}</div></div>
    <div class="field"><div class="field-label">Tipo</div><div class="field-value">${audit.type || "—"}</div></div>
    <div class="field"><div class="field-label">Planta</div><div class="field-value">${plantName}</div></div>
    <div class="field"><div class="field-label">Área</div><div class="field-value">${areaName}</div></div>
    <div class="field"><div class="field-label">Fecha de Creación</div><div class="field-value">${new Date(audit.created_at).toLocaleDateString()}</div></div>
    <div class="field"><div class="field-label">Auditor / Responsable</div><div class="field-value">${responsibleName}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">⚠️ Hallazgos Registrados</div>
  <table class="table-findings">
    <thead>
      <tr>
        <th style="width: 8%">ID</th>
        <th>Descripción del Hallazgo</th>
        <th style="width: 20%">Ubicación</th>
        <th style="width: 15%">Categoría</th>
        <th style="width: 10%">Nivel</th>
        <th style="width: 12%">Estatus</th>
      </tr>
    </thead>
    <tbody>
      ${findings.length === 0 ? `<tr><td colspan="6" style="text-align:center">No hay hallazgos registrados</td></tr>` : findings.map(f => `
        <tr>
          <td>${f.id}</td>
          <td>${f.description || "—"}</td>
          <td>${f.location || "—"}</td>
          <td>${f.level || "—"}</td>
          <td>
            <span class="badge" style="background:${f.status === 'Abierto' ? '#C8102E' : f.status === 'En revisión' ? '#FB8C00' : '#43A047'}">${f.status}</span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>

<div class="footer">
  <div class="sign-box"><div class="sign-line">Auditor / Responsable</div></div>
  <div class="sign-box"><div class="sign-line">Seguridad Industrial</div></div>
</div>

<div class="watermark">RIS v1.0 — Nissan Motor de México</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`);
    win.document.close();
  };

  const downloadSupabaseImage = async (path) => {
    if (!path) return null;
    try {
      const signedUrl = await getSignedImageUrl(path);
      const res = await fetch(signedUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      const ext = path.split('.').pop().toLowerCase();
      const arrayBuffer = await blob.arrayBuffer();
      return { buffer: arrayBuffer, ext: ext === 'jpg' ? 'jpeg' : ext };
    } catch (err) {
      console.error("Error downloading image:", path, err);
      return null;
    }
  };

  const exportToExcel = async () => {
    try {
      setSaving(true);
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.default.Workbook();
      const sheet = workbook.addWorksheet("Reporte de Auditoría", {
        views: [{ state: 'frozen', ySplit: 5 }],
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
      });

      const headerFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC8102E' } // Nissan Red
      };
      
      const subHeaderFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' } // Light gray
      };

      const whiteFont = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      const boldFont = { name: 'Segoe UI', size: 10, bold: true };
      const regularFont = { name: 'Segoe UI', size: 10 };
      
      const centerAlign = { vertical: 'middle', horizontal: 'center', wrapText: true };
      const leftAlign = { vertical: 'middle', horizontal: 'left', wrapText: true };
      
      const thinBorder = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };

      sheet.columns = [
        { key: 'no', width: 6 },
        { key: 'lugar', width: 25 },
        { key: 'hallazgo', width: 35 },
        { key: 'imagen_hallazgo', width: 28 },
        { key: 'norma', width: 18 },
        { key: 'grado', width: 10 },
        { key: 'correctivas', width: 35 },
        { key: 'imagen_contramedida', width: 28 },
        { key: 'responsable', width: 25 },
        { key: 'fecha_conclusion', width: 16 },
        { key: 'fecha_verif', width: 16 }
      ];

      // Row 1: Header Title
      sheet.mergeCells("A1:K1");
      const titleCell = sheet.getCell("A1");
      titleCell.value = "REPORTE DE AUDITORÍA";
      titleCell.fill = headerFill;
      titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = centerAlign;
      sheet.getRow(1).height = 40;

      // Row 3-5: Info General
      sheet.getCell("A3").value = "Folio:";
      sheet.getCell("A3").font = boldFont;
      sheet.getCell("B3").value = audit.audit_folio || "—";
      sheet.getCell("B3").font = regularFont;

      sheet.getCell("D3").value = "Planta:";
      sheet.getCell("D3").font = boldFont;
      sheet.getCell("E3").value = plantName;
      sheet.getCell("E3").font = regularFont;

      sheet.getCell("A4").value = "Área Evaluada:";
      sheet.getCell("A4").font = boldFont;
      sheet.getCell("B4").value = areaName;
      sheet.getCell("B4").font = regularFont;

      sheet.getCell("D4").value = "Fecha Creación:";
      sheet.getCell("D4").font = boldFont;
      sheet.getCell("E4").value = new Date(audit.created_at).toLocaleDateString();
      sheet.getCell("E4").font = regularFont;

      sheet.getCell("A5").value = "Auditor:";
      sheet.getCell("A5").font = boldFont;
      sheet.getCell("B5").value = responsibleName;
      sheet.getCell("B5").font = regularFont;

      // Section 2: Firmas (Row 7-8)
      sheet.mergeCells("A7:K7");
      const signaturesTitle = sheet.getCell("A7");
      signaturesTitle.value = "FIRMAS DE CONFORMIDAD";
      signaturesTitle.font = boldFont;
      signaturesTitle.fill = subHeaderFill;
      signaturesTitle.alignment = leftAlign;
      sheet.getRow(7).height = 20;

      sheet.getRow(9).height = 40; // Espacio de firma
      sheet.getCell("B9").value = "___________________________";
      sheet.getCell("B9").alignment = centerAlign;
      sheet.getCell("F9").value = "___________________________";
      sheet.getCell("F9").alignment = centerAlign;
      sheet.getCell("J9").value = "___________________________";
      sheet.getCell("J9").alignment = centerAlign;

      sheet.getCell("B10").value = "Supervisor del Área";
      sheet.getCell("B10").font = boldFont;
      sheet.getCell("B10").alignment = centerAlign;
      sheet.getCell("F10").value = "Seguridad Industrial";
      sheet.getCell("F10").font = boldFont;
      sheet.getCell("F10").alignment = centerAlign;
      sheet.getCell("J10").value = "Manager o Junior";
      sheet.getCell("J10").font = boldFont;
      sheet.getCell("J10").alignment = centerAlign;

      // Section 3: Tabla Resumen de Puntajes (Row 12-18)
      sheet.mergeCells("A12:K12");
      const scoreTitle = sheet.getCell("A12");
      scoreTitle.value = "RESUMEN DE PUNTAJES";
      scoreTitle.font = boldFont;
      scoreTitle.fill = subHeaderFill;
      scoreTitle.alignment = leftAlign;
      sheet.getRow(12).height = 20;

      sheet.getCell("A13").value = "Grado";
      sheet.getCell("B13").value = "Valor";
      sheet.getCell("C13").value = "Cantidad";
      sheet.getCell("D13").value = "Puntos";
      for (const col of ["A", "B", "C", "D"]) {
        const c = sheet.getCell(`${col}13`);
        c.font = boldFont;
        c.fill = subHeaderFill;
        c.border = thinBorder;
        c.alignment = centerAlign;
      }

      const countA = findings.filter(f => f.level === "A").length;
      const countB = findings.filter(f => f.level === "B").length;
      const countC = findings.filter(f => f.level === "C").length;
      const countOtros = findings.filter(f => !["A", "B", "C"].includes(f.level)).length;

      const scoreRows = [
        ["A", 9, countA, countA * 9],
        ["B", 3, countB, countB * 3],
        ["C", 1, countC, countC * 1],
        ["Otros", 0, countOtros, 0]
      ];

      scoreRows.forEach((r, idx) => {
        const rowNum = 14 + idx;
        sheet.getCell(`A${rowNum}`).value = r[0];
        sheet.getCell(`B${rowNum}`).value = r[1];
        sheet.getCell(`C${rowNum}`).value = r[2];
        sheet.getCell(`D${rowNum}`).value = r[3];
        for (const col of ["A", "B", "C", "D"]) {
          const c = sheet.getCell(`${col}${rowNum}`);
          c.border = thinBorder;
          c.alignment = centerAlign;
          c.font = regularFont;
        }
      });

      // Total Row
      const totalRow = 18;
      sheet.getCell(`A${totalRow}`).value = "TOTAL PUNTOS";
      sheet.getCell(`A${totalRow}`).font = boldFont;
      sheet.getCell(`D${totalRow}`).value = (countA * 9) + (countB * 3) + (countC * 1);
      sheet.getCell(`D${totalRow}`).font = boldFont;
      for (const col of ["A", "B", "C", "D"]) {
        const c = sheet.getCell(`${col}${totalRow}`);
        c.border = thinBorder;
        c.fill = subHeaderFill;
        c.alignment = centerAlign;
      }

      // Section 4: Tabla de Hallazgos (Row 20+)
      sheet.mergeCells("A20:K20");
      const findingsTitle = sheet.getCell("A20");
      findingsTitle.value = "DETALLE DE HALLAZGOS REGISTRADOS";
      findingsTitle.font = boldFont;
      findingsTitle.fill = subHeaderFill;
      findingsTitle.alignment = leftAlign;
      sheet.getRow(20).height = 20;

      const headers = [
        "No", "Lugar / Proceso / Equipo", "Hallazgo", "Imagen del Hallazgo",
        "Referencia Norma", "Grado", "Actividades Correctivas", "Imagen Contramedida",
        "Responsable (Firma)", "Fecha Conclusión", "Fecha Verificación / Estatus"
      ];

      headers.forEach((h, idx) => {
        const colLetter = String.fromCharCode(65 + idx);
        const cell = sheet.getCell(`${colLetter}21`);
        cell.value = h;
        cell.font = whiteFont;
        cell.fill = headerFill;
        cell.alignment = centerAlign;
        cell.border = thinBorder;
      });
      sheet.getRow(21).height = 28;

      let currentRow = 22;
      for (let i = 0; i < findings.length; i++) {
        const f = findings[i];
        sheet.getRow(currentRow).height = 120;

        sheet.getCell(`A${currentRow}`).value = i + 1;
        sheet.getCell(`B${currentRow}`).value = f.location || "—";
        sheet.getCell(`C${currentRow}`).value = f.description || "—";
        sheet.getCell(`E${currentRow}`).value = f.reference_to_the_standard || "—";
        sheet.getCell(`F${currentRow}`).value = f.level || "—";
        sheet.getCell(`G${currentRow}`).value = f.corrective_action || "—";
        sheet.getCell(`I${currentRow}`).value = `${getUserFullName(f.id_responsible_user)}\n\n(Firma: ________________)`;
        sheet.getCell(`J${currentRow}`).value = f.conclusion_date ? new Date(f.conclusion_date).toLocaleDateString() : "—";
        sheet.getCell(`K${currentRow}`).value = `${f.status || "—"}${f.verification_date ? `\n(Verif: ${new Date(f.verification_date).toLocaleDateString()})` : ''}`;

        for (let colIdx = 0; colIdx < 11; colIdx++) {
          const colLetter = String.fromCharCode(65 + colIdx);
          const cell = sheet.getCell(`${colLetter}${currentRow}`);
          cell.border = thinBorder;
          cell.font = regularFont;
          
          if (["A", "E", "F", "J", "K"].includes(colLetter)) {
            cell.alignment = centerAlign;
          } else {
            cell.alignment = leftAlign;
          }
        }

        const addImageToCell = async (path, colLetter, colIndex) => {
          if (!path) {
            sheet.getCell(`${colLetter}${currentRow}`).value = "Sin imagen";
            sheet.getCell(`${colLetter}${currentRow}`).alignment = centerAlign;
            return;
          }
          try {
            const imgData = await downloadSupabaseImage(path);
            if (imgData) {
              const imageId = workbook.addImage({
                buffer: imgData.buffer,
                extension: imgData.ext
              });
              sheet.addImage(imageId, {
                tl: { col: colIndex, row: currentRow - 1, xOffset: 15, yOffset: 15 },
                ext: { width: 140, height: 120 }
              });
              sheet.getCell(`${colLetter}${currentRow}`).value = "";
            } else {
              sheet.getCell(`${colLetter}${currentRow}`).value = "Sin imagen";
              sheet.getCell(`${colLetter}${currentRow}`).alignment = centerAlign;
            }
          } catch (e) {
            console.error("Image loading failed:", e);
            sheet.getCell(`${colLetter}${currentRow}`).value = "Error al cargar";
            sheet.getCell(`${colLetter}${currentRow}`).alignment = centerAlign;
          }
        };

        await addImageToCell(f.finding_image_path, "D", 3);
        await addImageToCell(f.countermeasure_image_path, "H", 7);

        currentRow++;
      }

      sheet.autoFilter = {
        from: { row: 21, column: 1 },
        to: { row: currentRow - 1, column: 11 }
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Reporte_Auditoria_${audit.audit_folio || audit.id}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Excel generation error:", err);
      alert("Error al generar el formato Excel. Inténtelo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFinding = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...findingForm,
        id_audit: Number(id),
        id_plant: Number(audit.id_plant),
        id_area: Number(audit.id_area),
        finding_type: "Auditoría"
      };
      await createFinding(payload);
      setShowAddFindingModal(false);
      setFindingForm({ description: "", location: "", level: "A", reference_to_the_standard: "", finding_category: "Condición Insegura" });
      const updatedFindings = await getFindingsByAuditId(id);
      setFindings(updatedFindings);
    } catch (err) {
      console.error("Error creating finding:", err);
      alert("Error al crear el hallazgo");
    } finally {
      setSaving(false);
    }
  };

  const openEditFinding = (finding) => {
    setSelectedFindingId(finding.id);
    setEditFindingForm({
      description: finding.description || "",
      location: finding.location || "",
      status: finding.status || "",
      level: finding.level || "A",
      reference_to_the_standard: finding.reference_to_the_standard || "",
      finding_category: finding.finding_category || "Condición Insegura",
      corrective_action: finding.corrective_action || "",
      conclusion_date: finding.conclusion_date ? finding.conclusion_date.split("T")[0] : "",
      finding_image_path: finding.finding_image_path || "",
      countermeasure_image_path: finding.countermeasure_image_path || "",
      finding_type: finding.finding_type || "General",
    });
    setShowEditFindingModal(true);

    // Load previews
    if (finding.finding_image_path) {
      getSignedImageUrl(finding.finding_image_path).then(setEditFindingPreview);
    } else {
      setEditFindingPreview("");
    }
    if (finding.countermeasure_image_path) {
      getSignedImageUrl(finding.countermeasure_image_path).then(setEditCountermeasurePreview);
    } else {
      setEditCountermeasurePreview("");
    }
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

  const handleEditImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      alert(validationError);
      e.target.value = "";
      return;
    }

    if (type === "finding") {
      setUploadingFinding(true);
    } else {
      setUploadingCountermeasure(true);
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const extension = file.name.split(".").pop().toLowerCase();
      
      const previousPath = type === "finding" ? editFindingForm.finding_image_path : editFindingForm.countermeasure_image_path;
      if (previousPath) {
        await deleteImage(previousPath);
      }

      const path = `finding-${selectedFindingId}/${type}-${timestamp}.${extension}`;
      await uploadImage(file, path);
      
      const signedUrl = await getSignedImageUrl(path);

      setEditFindingForm((prev) => ({
        ...prev,
        [type === "finding" ? "finding_image_path" : "countermeasure_image_path"]: path,
      }));

      if (type === "finding") {
        setEditFindingPreview(signedUrl);
      } else {
        setEditCountermeasurePreview(signedUrl);
      }
    } catch (err) {
      console.error(`Error uploading ${type} image:`, err);
      alert(`Error al subir la imagen de ${type}.`);
      e.target.value = "";
    } finally {
      if (type === "finding") {
        setUploadingFinding(false);
      } else {
        setUploadingCountermeasure(false);
      }
    }
  };

  const handleRemoveEditImage = async (type) => {
    const path = type === "finding" ? editFindingForm.finding_image_path : editFindingForm.countermeasure_image_path;
    if (!path) return;

    if (type === "finding") {
      setUploadingFinding(true);
    } else {
      setUploadingCountermeasure(true);
    }

    try {
      await deleteImage(path);
      setEditFindingForm((prev) => ({
        ...prev,
        [type === "finding" ? "finding_image_path" : "countermeasure_image_path"]: "",
      }));
      if (type === "finding") {
        setEditFindingPreview("");
        const input = document.getElementById("edit-audit-finding-image-input");
        if (input) input.value = "";
      } else {
        setEditCountermeasurePreview("");
        const input = document.getElementById("edit-audit-countermeasure-image-input");
        if (input) input.value = "";
      }
    } catch (err) {
      console.error("Error deleting image:", err);
    } finally {
      if (type === "finding") {
        setUploadingFinding(false);
      } else {
        setUploadingCountermeasure(false);
      }
    }
  };

  const handleUpdateFinding = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateFinding(selectedFindingId, editFindingForm);
      setShowEditFindingModal(false);
      const updatedFindings = await getFindingsByAuditId(id);
      setFindings(updatedFindings);
      alert("Hallazgo actualizado");
    } catch (err) {
      console.error("Error updating finding:", err);
      alert("Error al actualizar el hallazgo");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteFinding = (id) => {
    setFindingToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteFinding = async () => {
    if (!findingToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFinding(findingToDelete);
      setBulkSuccessMsg("Hallazgo eliminado con éxito.");
      setShowDeleteConfirm(false);
      setFindingToDelete(null);
      const updatedFindings = await getFindingsByAuditId(id);
      setFindings(updatedFindings.length > 0 ? updatedFindings : DEMO_FINDINGS.filter(f => String(f.id_audit) === String(id)));
    } catch (err) {
      console.error("Error deleting finding:", err);
      setBulkErrorMsg("Error al eliminar el hallazgo.");
    } finally {
      setIsDeleting(false);
      setTimeout(() => {
        setBulkSuccessMsg("");
        setBulkErrorMsg("");
      }, 5000);
    }
  };

  if (loading) return <div className="auditorias-page"><div className="empty-state">Cargando detalles...</div></div>;
  if (!audit) return <div className="auditorias-page"><div className="empty-state">No se encontró la auditoría.</div></div>;

  const plantName = plants.find(p => p.id === audit.id_plant)?.name || audit.id_plant;
  const areaName = areas.find(a => a.id === audit.id_area)?.name || audit.id_area;
  const responsibleName = getUserFullName(audit.id_responsible_user || audit.id_audit_user);

  return (
    <div className="auditorias-page">
      <div className="auditorias-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button 
            onClick={() => navigate("/auditorias")}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle, #333)',
              color: 'var(--text-primary)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s ease, opacity 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
             Volver a Auditorías
          </button>
        </div>

        <div className="audit-detail-header animate-in glass" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className={`audit-type-badge type-${audit.type.toLowerCase()}`} style={{ position: 'static', marginBottom: '0.5rem', display: 'inline-block' }}>
                {audit.type}
              </span>
              <h1 style={{ margin: '0.5rem 0' }}>{audit.name}</h1>
              <p className="audit-folio" style={{ fontSize: '1.1rem' }}>{audit.audit_folio}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn-new-audit" 
                style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle, #333)', color: 'var(--text-primary)' }}
                onClick={printAudit}
              >
                🖨️ Generar Formato
              </button>
              <button 
                className="btn-new-audit" 
                style={{ background: 'linear-gradient(135deg, #1D6F42, #105B34)', border: 'none', color: 'white' }}
                onClick={exportToExcel}
              >
                📥 Exportar a Excel
              </button>
              {(role !== "Supervisor" && role !== "Admin") && (
                <button className="btn-new-audit" onClick={() => setShowAddFindingModal(true)}>
                  + Agregar Hallazgo
                </button>
              )}
            </div>
          </div>

          <div className="audit-info" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <div className="info-item">📍 Planta: <span>{plantName}</span></div>
            <div className="info-item"> Área: <span>{areaName}</span></div>
            <div className="info-item"> Fecha: <span>{new Date(audit.created_at).toLocaleDateString()}</span></div>
            <div className="info-item"> Responsable: <span>{responsibleName}</span></div>
          </div>
        </div>

        {/* Success/Error Feedback */}
        {bulkSuccessMsg && (
          <div className="bulk-feedback success animate-in" style={{ marginBottom: '1.5rem' }}>
            {bulkSuccessMsg}
          </div>
        )}
        {bulkErrorMsg && (
          <div className="bulk-feedback error animate-in" style={{ marginBottom: '1.5rem' }}>
            {bulkErrorMsg}
          </div>
        )}

        <h2 className="animate-in animate-in-delay-1" style={{ marginBottom: '1.5rem' }}>Hallazgos Registrados ({findings.length})</h2>

        {/* Bulk Actions Bar */}
        {(role === "Supervisor" || role === "Security") && findings.length > 0 && (
          <div className="bulk-actions-bar animate-in" style={{ marginBottom: '1.5rem' }}>
            <span>
              <strong>{selectedFindings.length}</strong> hallazgo(s) seleccionado(s)
            </span>
            <div className="bulk-actions-buttons">
              {role === "Supervisor" && (
                <button
                  className="btn-action"
                  style={{ background: '#FB8C00', color: 'white' }}
                  onClick={() => openConfirmModal("Enviar")}
                  disabled={selectedFindings.length === 0 || bulkProcessing}
                >
                  Enviar a revisión
                </button>
              )}
              {role === "Security" && (
                <>
                  <button
                    className="btn-close-finding"
                    style={{ background: '#43A047', color: 'white' }}
                    onClick={() => openConfirmModal("Cerrar")}
                    disabled={selectedFindings.length === 0 || bulkProcessing}
                  >
                    Cerrar
                  </button>
                  <button
                    className="btn-reject"
                    style={{ background: '#E53935', color: 'white' }}
                    onClick={() => openConfirmModal("Rechazar")}
                    disabled={selectedFindings.length === 0 || bulkProcessing}
                  >
                    Rechazar
                  </button>
                </>
              )}
              <button
                className="btn-cancel"
                onClick={() => setSelectedFindings([])}
                disabled={selectedFindings.length === 0 || bulkProcessing}
              >
                Cancelar selección
              </button>
            </div>
          </div>
        )}

        {findings.length === 0 ? (
          <div className="empty-state animate-in animate-in-delay-2 glass" style={{ borderRadius: '16px' }}>
            No hay hallazgos registrados para esta auditoría todavía.
          </div>
        ) : (
          <div className="admin-table-wrapper animate-in animate-in-delay-2">
            <table className="admin-table">
              <thead>
                <tr>
                  {(role === "Supervisor" || role === "Security") && (
                    <th style={{ textAlign: 'center', width: '50px' }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          eligibleVisibleFindings.length > 0 &&
                          eligibleVisibleFindings.every((f) =>
                            selectedFindings.includes(f.id)
                          )
                        }
                        ref={(el) => {
                          if (el) {
                            const someSelected = eligibleVisibleFindings.some((f) =>
                              selectedFindings.includes(f.id)
                            );
                            const allSelected = eligibleVisibleFindings.every((f) =>
                              selectedFindings.includes(f.id)
                            );
                            el.indeterminate = someSelected && !allSelected;
                          }
                        }}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                  )}
                  <th>ID</th>
                  <th>Descripción del Hallazgo</th>
                  <th>Ubicación / Equipo</th>
                  <th>Categoría</th>
                  <th>Referencia Norma</th>
                  <th>Nivel</th>
                  <th>Estatus</th>
                  <th style={{ textAlign: 'center' }}>{role === "Security" ? "Acciones" : "Editar"}</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f) => {
                  const isSelected = selectedFindings.includes(f.id);
                  const isEligible = role === "Security" || (role === "Supervisor" && f.status?.toLowerCase() === "abierto");
                  
                  let rowClass = "";
                  if (isSelected) rowClass = "row-selected";

                  return (
                    <tr key={f.id} className={rowClass}>
                      {(role === "Supervisor" || role === "Security") && (
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isEligible}
                            onChange={() => handleSelectIndividual(f.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                      )}
                      <td className="cell-id">{f.id}</td>
                      <td className="cell-desc" style={{ whiteSpace: 'normal', wordBreak: 'break-word', minWidth: '220px' }}>
                        <div>{f.description}</div>
                        <FindingImage path={f.finding_image_path} label="Imagen del Hallazgo" />
                        <FindingImage path={f.countermeasure_image_path} label="Imagen de Contramedida" />
                      </td>
                      <td>{f.location}</td>
                      <td>
                        <span className="category-badge">
                          {f.finding_category}
                        </span>
                      </td>
                      <td>{f.reference_to_the_standard || "—"}</td>
                      <td style={{ textAlign: 'center' }}>{f.level || "—"}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            background:
                              f.status === 'Abierto' ? 'var(--primary)' : f.status === 'En revisión' ? '#FB8C00' : f.status === 'Cerrado' ? '#43A047' : '#757575',
                          }}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            className="btn-edit"
                            onClick={() => openEditFinding(f)}
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                          >
                            ✏️
                          </button>
                          {role === "Security" && (
                            <button
                              className="btn-delete"
                              onClick={() => confirmDeleteFinding(f.id)}
                              disabled={f.status?.toLowerCase() !== "abierto"}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '0.85rem',
                                background: f.status?.toLowerCase() === "abierto" ? '#E53935' : '#757575',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: f.status?.toLowerCase() === "abierto" ? 'pointer' : 'not-allowed',
                                opacity: f.status?.toLowerCase() === "abierto" ? '1' : '0.5',
                                transition: 'opacity 0.2s'
                              }}
                              onMouseOver={(e) => {
                                if (f.status?.toLowerCase() === "abierto") {
                                  e.currentTarget.style.opacity = '0.8';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (f.status?.toLowerCase() === "abierto") {
                                  e.currentTarget.style.opacity = '1';
                                }
                              }}
                            >
                              🗑️ Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="popup" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content glass" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Acción Masiva</h2>
              <button className="btn-close" onClick={() => setShowConfirmModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                {actionType === "Enviar" && "¿Estás seguro de enviar los hallazgos seleccionados a revisión?"}
                {actionType === "Cerrar" && "¿Estás seguro de cerrar los hallazgos seleccionados?"}
                {actionType === "Rechazar" && "¿Estás seguro de rechazar los hallazgos seleccionados?"}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-cancel" onClick={() => setShowConfirmModal(false)}>
                  Cancelar
                </button>
                <button
                  className="btn-save"
                  style={{
                    background:
                      actionType === "Enviar" ? '#FB8C00' :
                      actionType === "Cerrar" ? '#43A047' : '#E53935'
                  }}
                  onClick={handleConfirmAction}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Finding Modal */}
      {showEditFindingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Editar Hallazgo</h2>
              <button className="btn-close" onClick={() => setShowEditFindingModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateFinding}>
              <div className="modal-body">
                <div className="audit-form-grid">
                  <div className="form-group full">
                    <label>Descripción del Hallazgo</label>
                    <textarea 
                      value={editFindingForm.description} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, description: e.target.value})} 
                      required={role !== "Supervisor"}
                      disabled={role === "Supervisor"}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ubicación / Equipo</label>
                    <input 
                      type="text" 
                      value={editFindingForm.location} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, location: e.target.value})} 
                      required={role !== "Supervisor"}
                      disabled={role === "Supervisor"}
                    />
                  </div>
                  <div className="form-group">
                    <label>Referencia a la Norma</label>
                    <input 
                      type="text" 
                      value={editFindingForm.reference_to_the_standard} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, reference_to_the_standard: e.target.value})} 
                      required={role !== "Supervisor"}
                      disabled={role === "Supervisor"}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nivel</label>
                    <select 
                      value={editFindingForm.level} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, level: e.target.value})} 
                      required={role !== "Supervisor"}
                      disabled={role === "Supervisor"}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select 
                      value={editFindingForm.finding_category} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, finding_category: e.target.value})} 
                      required={role !== "Supervisor"}
                      disabled={role === "Supervisor"}
                    >
                      <option value="Acto Inseguro">Acto Inseguro</option>
                      <option value="Condición Insegura">Condición Insegura</option>
                      <option value="Condición NG">Condición NG</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipo de Hallazgo</label>
                    <select 
                      value={editFindingForm.finding_type} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, finding_type: e.target.value})} 
                      required={role !== "Supervisor"}
                      disabled={role === "Supervisor"}
                    >
                      <option value="General">General</option>
                      <option value="Auditoría">Auditoría</option>
                      <option value="Incidente">Incidente</option>
                      <option value="5S">5S</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estatus</label>
                    <select 
                      value={editFindingForm.status} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, status: e.target.value})} 
                      required={role !== "Supervisor"}
                      disabled={role === "Supervisor" || role === "Security"}
                    >
                      {role === "Security" ? (
                        <>
                          <option value="Abierto">Abierto</option>
                          <option value="En revisión">En revisión</option>
                          <option value="Cerrado">Cerrado</option>
                          <option value="Rechazado">Rechazado</option>
                        </>
                      ) : (role === "Supervisor" || role === "Admin") ? (
                        <>
                          <option value="Abierto">Abierto</option>
                          <option value="En revisión">En revisión</option>
                        </>
                      ) : (
                        <>
                          <option value="Abierto">Abierto</option>
                          <option value="En revisión">En revisión</option>
                          <option value="Cerrado">Cerrado</option>
                          <option value="Rechazado">Rechazado</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Acción Correctiva</label>
                    <textarea 
                      value={editFindingForm.corrective_action} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, corrective_action: e.target.value})} 
                      disabled={role === "Security"}
                      rows={2}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Conclusión</label>
                    <input 
                      type="date" 
                      value={editFindingForm.conclusion_date} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, conclusion_date: e.target.value})} 
                      disabled={role === "Security"}
                    />
                  </div>

                  {/* Imagen del Hallazgo */}
                  <div className="form-group">
                    <label>Imagen del Hallazgo</label>
                    <input
                      id="edit-audit-finding-image-input"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={(e) => handleEditImageUpload(e, "finding")}
                      disabled={uploadingFinding || role === "Supervisor"}
                    />
                    {uploadingFinding && <span className="upload-loading">Subiendo...</span>}
                    {editFindingPreview && (
                      <div className="image-preview-container" style={{ marginTop: "10px", position: "relative" }}>
                        <img src={editFindingPreview} alt="Preview Hallazgo" style={{ maxWidth: "100%", maxHeight: "100px", borderRadius: "6px" }} />
                        {role !== "Supervisor" && (
                          <button type="button" className="btn-cancel" style={{ display: "block", marginTop: "5px", padding: "2px 8px", fontSize: "0.8rem" }} onClick={() => handleRemoveEditImage("finding")}>
                            Eliminar imagen
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Imagen de Contramedida */}
                  <div className="form-group">
                    <label>Imagen de Contramedida</label>
                    <input
                      id="edit-audit-countermeasure-image-input"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={(e) => handleEditImageUpload(e, "countermeasure")}
                      disabled={uploadingCountermeasure || role === "Security"}
                    />
                    {uploadingCountermeasure && <span className="upload-loading">Subiendo...</span>}
                    {editCountermeasurePreview && (
                      <div className="image-preview-container" style={{ marginTop: "10px", position: "relative" }}>
                        <img src={editCountermeasurePreview} alt="Preview Contramedida" style={{ maxWidth: "100%", maxHeight: "100px", borderRadius: "6px" }} />
                        {role !== "Security" && (
                          <button type="button" className="btn-cancel" style={{ display: "block", marginTop: "5px", padding: "2px 8px", fontSize: "0.8rem" }} onClick={() => handleRemoveEditImage("countermeasure")}>
                            Eliminar imagen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowEditFindingModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : "Actualizar Hallazgo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Finding Modal */}
      {showAddFindingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nuevo Hallazgo</h2>
              <button className="btn-close" onClick={() => setShowAddFindingModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateFinding}>
              <div className="modal-body">
                <div className="audit-form-grid">
                  <div className="form-group full">
                    <label>Descripción del Hallazgo</label>
                    <textarea 
                      name="description" 
                      value={findingForm.description} 
                      onChange={(e) => setFindingForm(p => ({...p, description: e.target.value}))} 
                      placeholder="Describe lo encontrado..."
                      required 
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ubicación / Equipo</label>
                    <input 
                      type="text" 
                      name="location" 
                      value={findingForm.location} 
                      onChange={(e) => setFindingForm(p => ({...p, location: e.target.value}))} 
                      placeholder="Ej. Línea de ensamble"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Referencia a la Norma</label>
                    <input 
                      type="text" 
                      name="reference_to_the_standard" 
                      value={findingForm.reference_to_the_standard} 
                      onChange={(e) => setFindingForm(p => ({...p, reference_to_the_standard: e.target.value}))} 
                      placeholder="Ej. ISO 14001"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Nivel</label>
                    <select 
                      name="level" 
                      value={findingForm.level} 
                      onChange={(e) => setFindingForm(p => ({...p, level: e.target.value}))} 
                      required
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select 
                      name="finding_category" 
                      value={findingForm.finding_category} 
                      onChange={(e) => setFindingForm(p => ({...p, finding_category: e.target.value}))} 
                      required
                    >
                      <option value="Acto Inseguro">Acto Inseguro</option>
                      <option value="Condición Insegura">Condición Insegura</option>
                      <option value="Condición NG">Condición NG</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowAddFindingModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Hallazgo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Finding Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content glass" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="btn-close" onClick={() => setShowDeleteConfirm(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                ¿Estás seguro de eliminar este hallazgo?
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                  Cancelar
                </button>
                <button
                  className="btn-save"
                  style={{ background: '#E53935', color: 'white' }}
                  onClick={handleDeleteFinding}
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

export default DetalleAuditoria;

