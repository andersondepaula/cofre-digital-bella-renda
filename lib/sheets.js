import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

export const ABA_SENHAS = "Senhas";
export const ABA_SORTEIOS = "Sorteios";
export const ABA_CASHBACK = "Cashback";

let cachedDoc = null;

export async function getDoc() {
  if (cachedDoc) return cachedDoc;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !rawKey || !sheetId) {
    throw new Error(
      "Faltam variáveis de ambiente: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY ou GOOGLE_SHEET_ID"
    );
  }

  const privateKey = rawKey.replace(/\\n/g, "\n");

  const jwt = new JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(sheetId, jwt);
  await doc.loadInfo();

  cachedDoc = doc;
  return doc;
}

export function normalizarSenha(valor) {
  return String(valor).trim().padStart(6, "0");
}

export function normalizarWhatsapp(valor) {
  const digitos = String(valor).replace(/\D/g, "");
  if (digitos.length <= 11) return "55" + digitos;
  return digitos;
}

export function agora() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
