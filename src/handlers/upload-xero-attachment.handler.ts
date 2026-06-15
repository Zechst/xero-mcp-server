import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { xeroClient } from "../clients/xero-client.js";
import { Attachment } from "xero-node";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { getClientHeaders } from "../helpers/get-client-headers.js";
import { AttachmentEntityType } from "./list-xero-attachments.handler.js";

async function uploadAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
  fileName: string,
  content: Buffer,
  includeOnline?: boolean,
): Promise<Attachment> {
  await xeroClient.authenticate();
  const api = xeroClient.accountingApi;
  const tenantId = xeroClient.tenantId;
  const headers = getClientHeaders();

  let attachment: Attachment | undefined;

  switch (entityType) {
    case "Accounts":
      attachment = (await api.createAccountAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "BankTransactions":
      attachment = (await api.createBankTransactionAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "BankTransfers":
      attachment = (await api.createBankTransferAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "Contacts":
      attachment = (await api.createContactAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "CreditNotes":
      attachment = (await api.createCreditNoteAttachmentByFileName(tenantId, entityId, fileName, content, includeOnline, undefined, headers)).body.attachments?.[0];
      break;
    case "Invoices":
      attachment = (await api.createInvoiceAttachmentByFileName(tenantId, entityId, fileName, content, includeOnline, undefined, headers)).body.attachments?.[0];
      break;
    case "ManualJournals":
      attachment = (await api.createManualJournalAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "PurchaseOrders":
      attachment = (await api.createPurchaseOrderAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "Quotes":
      attachment = (await api.createQuoteAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "Receipts":
      attachment = (await api.createReceiptAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "RepeatingInvoices":
      attachment = (await api.createRepeatingInvoiceAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
  }

  if (!attachment) throw new Error("Attachment upload failed.");
  return attachment;
}

function fetchUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

export async function uploadXeroAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
  fileName: string,
  contentBase64: string | undefined,
  includeOnline?: boolean,
  filePath?: string,
  fileUrl?: string,
): Promise<XeroClientResponse<Attachment>> {
  try {
    let buffer: Buffer;
    if (fileUrl) {
      buffer = await fetchUrl(fileUrl);
    } else if (filePath) {
      const resolved = path.resolve(filePath);
      buffer = fs.readFileSync(resolved);
    } else if (contentBase64) {
      buffer = Buffer.from(contentBase64, "base64");
    } else {
      throw new Error("One of fileUrl, filePath, or contentBase64 must be provided.");
    }
    const attachment = await uploadAttachment(entityType, entityId, fileName, buffer, includeOnline);
    return { result: attachment, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
