import fs from "fs";
import path from "path";
import { xeroClient } from "../clients/xero-client.js";
import { Attachment } from "xero-node";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { getClientHeaders } from "../helpers/get-client-headers.js";
import { AttachmentEntityType } from "./list-xero-attachments.handler.js";

async function replaceAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
  fileName: string,
  content: Buffer,
): Promise<Attachment> {
  await xeroClient.authenticate();
  const api = xeroClient.accountingApi;
  const tenantId = xeroClient.tenantId;
  const headers = getClientHeaders();

  let attachment: Attachment | undefined;

  switch (entityType) {
    case "Accounts":
      attachment = (await api.updateAccountAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "BankTransactions":
      attachment = (await api.updateBankTransactionAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "BankTransfers":
      attachment = (await api.updateBankTransferAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "Contacts":
      attachment = (await api.updateContactAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "CreditNotes":
      attachment = (await api.updateCreditNoteAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "Invoices":
      attachment = (await api.updateInvoiceAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "ManualJournals":
      attachment = (await api.updateManualJournalAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "PurchaseOrders":
      attachment = (await api.updatePurchaseOrderAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "Quotes":
      attachment = (await api.updateQuoteAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "Receipts":
      attachment = (await api.updateReceiptAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
    case "RepeatingInvoices":
      attachment = (await api.updateRepeatingInvoiceAttachmentByFileName(tenantId, entityId, fileName, content, undefined, headers)).body.attachments?.[0];
      break;
  }

  if (!attachment) throw new Error("Attachment update failed.");
  return attachment;
}

export async function updateXeroAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
  fileName: string,
  contentBase64: string | undefined,
  filePath?: string,
): Promise<XeroClientResponse<Attachment>> {
  try {
    let buffer: Buffer;
    if (filePath) {
      const resolved = path.resolve(filePath);
      buffer = fs.readFileSync(resolved);
    } else if (contentBase64) {
      buffer = Buffer.from(contentBase64, "base64");
    } else {
      throw new Error("Either contentBase64 or filePath must be provided.");
    }
    const attachment = await replaceAttachment(entityType, entityId, fileName, buffer);
    return { result: attachment, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
