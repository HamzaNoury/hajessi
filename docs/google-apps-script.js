/**
 * HAJESSI — Google Apps Script pour synchroniser les commandes
 *
 * INSTRUCTIONS :
 * 1. Créez une Google Sheet avec ces colonnes en ligne 1 :
 *    Date | Nom client | Téléphone | Ville | Adresse | Produit | Quantité | Prix unitaire | Total | Statut
 * 2. Extensions → Apps Script → collez ce code
 * 3. Déployer → Nouvelle déploiement → Application Web
 *    - Exécuter en tant que : Moi
 *    - Qui a accès : Tout le monde
 * 4. Copiez l'URL de déploiement dans GOOGLE_SHEET_WEBAPP_URL (.env.local)
 */

function doGet(e) {
  const action = e.parameter.action;

  if (action === "list") {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const orders = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      orders.push({
        id: String(i),
        date: row[0],
        clientName: row[1],
        phone: row[2],
        city: row[3],
        address: row[4],
        productName: row[5],
        quantity: row[6],
        unitPrice: row[7],
        total: row[8],
        status: row[9] || "nouvelle",
        rowIndex: i + 1,
      });
    }

    return ContentService.createTextOutput(
      JSON.stringify({ orders: orders })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ error: "Unknown action" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const body = JSON.parse(e.postData.contents);

  if (body.action === "create") {
    sheet.appendRow([
      body.date,
      body.clientName,
      body.phone,
      body.city,
      body.address,
      body.productName,
      body.quantity,
      body.unitPrice,
      body.total,
      body.status || "nouvelle",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (body.action === "updateStatus") {
    const row = body.rowIndex;
    const statusCol = 10; // colonne J (Statut)
    sheet.getRange(row, statusCol).setValue(body.status);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ error: "Unknown action" })
  ).setMimeType(ContentService.MimeType.JSON);
}
