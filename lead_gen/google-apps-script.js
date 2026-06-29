/**
 * AI Lead Gen Agent — Google Sheets sync
 *
 * 1. أنشئ Google Sheet → انسخ ID من URL:
 *    https://docs.google.com/spreadsheets/d/XXXX/edit  →  XXXX
 * 2. حط ID فـ lead_gen/.env → GOOGLE_SHEET_ID=XXXX
 * 3. Extensions → Apps Script → الصق هاد الكود
 * 4. Deploy → Web app → Me → Anyone → New version
 * 5. انسخ URL → GOOGLE_SHEET_WEBAPP_URL فـ .env
 */

const HEADERS = [
  "Date",
  "Nom",
  "Téléphone",
  "Email",
  "Site web",
  "Note",
  "Adresse",
  "Problèmes",
  "Message",
  "Statut",
  "PDF",
  "WhatsApp",
];

function getSpreadsheet_(spreadsheetId) {
  if (spreadsheetId) {
    PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", spreadsheetId);
    return SpreadsheetApp.openById(spreadsheetId);
  }

  const savedId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (savedId) {
    return SpreadsheetApp.openById(savedId);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      "Spreadsheet not linked. Set GOOGLE_SHEET_ID in .env or bind script to Sheet."
    );
  }
  return ss;
}

function getLeadsSheet_(spreadsheetId) {
  const ss = getSpreadsheet_(spreadsheetId);
  const sheet = ss.getSheets()[0];
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const headerRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsUpdate = HEADERS.some(function (title, i) {
    return headerRow[i] !== title;
  });
  if (needsUpdate) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function findRowByPhone_(sheet, phone) {
  const normalized = String(phone || "").replace(/\D/g, "");
  if (!normalized) return -1;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowPhone = String(data[i][2] || "").replace(/\D/g, "");
    if (rowPhone && rowPhone === normalized) {
      return i + 1;
    }
  }
  return -1;
}

function findRowByName_(sheet, name) {
  const normalized = String(name || "").trim().toLowerCase();
  if (!normalized) return -1;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowName = String(data[i][1] || "").trim().toLowerCase();
    if (rowName && rowName === normalized) {
      return i + 1;
    }
  }
  return -1;
}

function findLeadRow_(sheet, body) {
  const byPhone = findRowByPhone_(sheet, body.phone);
  if (byPhone > 0) return byPhone;
  return findRowByName_(sheet, body.business_name);
}

function buildWhatsAppUrl_(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return "https://wa.me/" + digits;
}

function buildWhatsAppFormula_(phone, linkFromPayload) {
  const url = linkFromPayload || buildWhatsAppUrl_(phone);
  if (!url) return "";
  const safeUrl = url.replace(/"/g, '""');
  return '=HYPERLINK("' + safeUrl + '","📲 إرسال")';
}

function writeRow_(sheet, rowIndex, rowData, whatsappFormula) {
  const values = rowData.slice(0, HEADERS.length - 1);
  const waCol = HEADERS.length;
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, rowIndex, HEADERS.length - 1).setValues([values]);
    const waCell = sheet.getRange(rowIndex, waCol);
    waCell.clearContent();
    if (whatsappFormula) {
      waCell.setFormula(whatsappFormula);
    }
  } else {
    sheet.appendRow(values);
    const newRow = sheet.getLastRow();
    const waCell = sheet.getRange(newRow, waCol);
    if (whatsappFormula) {
      waCell.setFormula(whatsappFormula);
    }
  }
}

function leadToRow_(body) {
  return [
    body.created_at || new Date().toISOString(),
    body.business_name || "",
    body.phone || "",
    body.email || "",
    body.website || "",
    body.rating != null ? body.rating : "",
    body.address || "",
    body.problems_found || "",
    body.message_sent || "",
    body.status || "new",
    body.audit_pdf_path || "",
  ];
}

function whatsappFormulaForLead_(body) {
  return buildWhatsAppFormula_(body.phone, body.whatsapp_link || "");
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = params.action || "";
  const spreadsheetId = params.spreadsheet_id || "";

  if (action === "ping") {
    return json_({ ok: true, service: "lead-gen-sheets" });
  }

  if (action === "list") {
    const sheet = getLeadsSheet_(spreadsheetId);
    const data = sheet.getDataRange().getValues();
    const leads = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[1] && !row[2]) continue;
      leads.push({
        created_at: row[0],
        business_name: row[1],
        phone: row[2],
        email: row[3],
        website: row[4],
        rating: row[5],
        address: row[6],
        problems_found: row[7],
        message_sent: row[8],
        status: row[9] || "new",
        audit_pdf_path: row[10] || "",
        whatsapp_link: buildWhatsAppUrl_(row[2]),
        rowIndex: i + 1,
      });
    }

    return json_({ leads: leads });
  }

  return json_({ error: "Unknown action" });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const spreadsheetId = body.spreadsheet_id || "";
  const sheet = getLeadsSheet_(spreadsheetId);

  if (body.action === "upsert_lead") {
    const rowData = leadToRow_(body);
    const rowIndex = findLeadRow_(sheet, body);
    const formula = whatsappFormulaForLead_(body);
    writeRow_(sheet, rowIndex, rowData, formula);
    return json_({
      success: true,
      rowIndex: rowIndex > 0 ? rowIndex : sheet.getLastRow(),
    });
  }

  if (body.action === "upsert_leads" && Array.isArray(body.leads)) {
    let count = 0;
    body.leads.forEach(function (lead) {
      const rowData = leadToRow_(lead);
      const rowIndex = findLeadRow_(sheet, lead);
      const formula = whatsappFormulaForLead_(lead);
      writeRow_(sheet, rowIndex, rowData, formula);
      count++;
    });
    return json_({ success: true, count: count });
  }

  if (body.action === "rewrite_all" && Array.isArray(body.leads)) {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    body.leads.forEach(function (lead) {
      const rowData = leadToRow_(lead);
      const formula = whatsappFormulaForLead_(lead);
      writeRow_(sheet, 0, rowData, formula);
    });
    return json_({ success: true, count: body.leads.length });
  }

  return json_({ error: "Unknown action" });
}
