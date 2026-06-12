import { xeroClient } from "../clients/xero-client.js";
import { Attachment } from "xero-node";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export type AttachmentEntityType =
  | "Accounts"
  | "BankTransactions"
  | "BankTransfers"
  | "Contacts"
  | "CreditNotes"
  | "Invoices"
  | "ManualJournals"
  | "PurchaseOrders"
  | "Quotes"
  | "Receipts"
  | "RepeatingInvoices";

async function fetchAttachments(
  entityType: AttachmentEntityType,
  entityId: string,
): Promise<Attachment[]> {
  await xeroClient.authenticate();
  const api = xeroClient.accountingApi;
  const tenantId = xeroClient.tenantId;

  switch (entityType) {
    case "Accounts":
      return (await api.getAccountAttachments(tenantId, entityId)).body.attachments ?? [];
    case "BankTransactions":
      return (await api.getBankTransactionAttachments(tenantId, entityId)).body.attachments ?? [];
    case "BankTransfers":
      return (await api.getBankTransferAttachments(tenantId, entityId)).body.attachments ?? [];
    case "Contacts":
      return (await api.getContactAttachments(tenantId, entityId)).body.attachments ?? [];
    case "CreditNotes":
      return (await api.getCreditNoteAttachments(tenantId, entityId)).body.attachments ?? [];
    case "Invoices":
      return (await api.getInvoiceAttachments(tenantId, entityId)).body.attachments ?? [];
    case "ManualJournals":
      return (await api.getManualJournalAttachments(tenantId, entityId)).body.attachments ?? [];
    case "PurchaseOrders":
      return (await api.getPurchaseOrderAttachments(tenantId, entityId)).body.attachments ?? [];
    case "Quotes":
      return (await api.getQuoteAttachments(tenantId, entityId)).body.attachments ?? [];
    case "Receipts":
      return (await api.getReceiptAttachments(tenantId, entityId)).body.attachments ?? [];
    case "RepeatingInvoices":
      return (await api.getRepeatingInvoiceAttachments(tenantId, entityId)).body.attachments ?? [];
  }
}

export async function listXeroAttachments(
  entityType: AttachmentEntityType,
  entityId: string,
): Promise<XeroClientResponse<Attachment[]>> {
  try {
    const attachments = await fetchAttachments(entityType, entityId);
    return { result: attachments, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
