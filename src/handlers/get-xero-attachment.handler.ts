import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { AttachmentEntityType } from "./list-xero-attachments.handler.js";

async function downloadAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
  fileName: string,
  mimeType: string,
): Promise<Buffer> {
  await xeroClient.authenticate();
  const api = xeroClient.accountingApi;
  const tenantId = xeroClient.tenantId;

  let body: Buffer;

  switch (entityType) {
    case "Accounts":
      body = (await api.getAccountAttachmentByFileName(tenantId, entityId, fileName, mimeType)).body as unknown as Buffer;
      break;
    case "BankTransactions":
      body = (await api.getBankTransactionAttachmentByFileName(tenantId, entityId, fileName, mimeType)).body as unknown as Buffer;
      break;
    case "BankTransfers":
      body = (await api.getBankTransferAttachmentByFileName(tenantId, entityId, fileName, mimeType)).body as unknown as Buffer;
      break;
    case "Contacts":
      body = (await api.getContactAttachmentByFileName(tenantId, entityId, fileName, mimeType)).body as unknown as Buffer;
      break;
    case "CreditNotes":
      body = (await api.getCreditNoteAttachmentByFileName(tenantId, entityId, fileName, mimeType)).body as unknown as Buffer;
      break;
    case "Invoices":
      body = (await api.getInvoiceAttachmentByFileName(tenantId, entityId, fileName, mimeType)).body as unknown as Buffer;
      break;
    case "ManualJournals":
      body = (await api.getManualJournalAttachmentByFileName(tenantId, entityId, fileName, mimeType)).body as unknown as Buffer;
      break;
    case "PurchaseOrders":
      body = (await api.getPurchaseOrderAttachmentByFileName(tenantId, entityId, fileName, mimeType)).body as unknown as Buffer;
      break;
    case "Quotes":
      body = (await api.getQuoteAttachmentByFileName(tenantId, entityId, fileName, mimeType)).body as unknown as Buffer;
      break;
    case "Receipts":
      body = (await api.getReceiptAttachmentByFileName(tenantId, entityId, fileName, mimeType)).body as unknown as Buffer;
      break;
    case "RepeatingInvoices":
      body = (await api.getRepeatingInvoiceAttachmentByFileName(tenantId, entityId, fileName, mimeType)).body as unknown as Buffer;
      break;
  }

  return body;
}

export async function getXeroAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
  fileName: string,
  mimeType: string,
): Promise<XeroClientResponse<string>> {
  try {
    const buffer = await downloadAttachment(entityType, entityId, fileName, mimeType);
    const base64 = Buffer.isBuffer(buffer) ? buffer.toString("base64") : Buffer.from(buffer).toString("base64");
    return { result: base64, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
