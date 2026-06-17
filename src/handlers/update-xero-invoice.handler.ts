import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { Invoice, LineItemTracking } from "xero-node";
import { getClientHeaders } from "../helpers/get-client-headers.js";

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  accountCode: string;
  taxType: string;
  itemCode?: string;
  tracking?: LineItemTracking[];
}

async function getInvoice(invoiceId: string): Promise<Invoice | undefined> {
  await xeroClient.authenticate();

  // First, get the current invoice to check its status
  const response = await xeroClient.accountingApi.getInvoice(
    xeroClient.tenantId,
    invoiceId, // invoiceId
    undefined, // unitdp
    getClientHeaders(), // options
  );

  return response.body.invoices?.[0];
}

async function updateInvoice(
  invoiceId: string,
  lineItems?: InvoiceLineItem[],
  reference?: string,
  invoiceNumber?: string,
  dueDate?: string,
  date?: string,
  contactId?: string,
  currencyRate?: number,
): Promise<Invoice | undefined> {
  const invoice: Invoice = {
    lineItems: lineItems,
    reference: reference,
    invoiceNumber: invoiceNumber,
    dueDate: dueDate,
    date: date,
    contact: contactId ? { contactID: contactId } : undefined,
    currencyRate: currencyRate,
  };

  const response = await xeroClient.accountingApi.updateInvoice(
    xeroClient.tenantId,
    invoiceId, // invoiceId
    {
      invoices: [invoice],
    }, // invoices
    undefined, // unitdp
    undefined, // idempotencyKey
    getClientHeaders(), // options
  );

  return response.body.invoices?.[0];
}

/**
 * Update an existing invoice in Xero
 */
export async function updateXeroInvoice(
  invoiceId: string,
  lineItems?: InvoiceLineItem[],
  reference?: string,
  invoiceNumber?: string,
  dueDate?: string,
  date?: string,
  contactId?: string,
  currencyRate?: number,
): Promise<XeroClientResponse<Invoice>> {
  try {
    const existingInvoice = await getInvoice(invoiceId);

    const invoiceStatus = existingInvoice?.status;

    if (invoiceStatus === Invoice.StatusEnum.VOIDED) {
      return {
        result: null,
        isError: true,
        error: "Cannot update a voided invoice.",
      };
    }

    // PAID invoices: only reference is editable
    if (invoiceStatus === Invoice.StatusEnum.PAID) {
      if (lineItems || dueDate || date || contactId || currencyRate) {
        return {
          result: null,
          isError: true,
          error: "PAID invoices only allow updating the reference field. Line items, dates, contact, and currency rate are locked.",
        };
      }
    }

    // AUTHORISED invoices: reference, dueDate, currencyRate only
    if (invoiceStatus === Invoice.StatusEnum.AUTHORISED) {
      if (lineItems || date || contactId) {
        return {
          result: null,
          isError: true,
          error: "AUTHORISED invoices only allow updating reference, dueDate, and currencyRate. Line items, invoice date, and contact are locked.",
        };
      }
    }

    const isDraft = invoiceStatus === Invoice.StatusEnum.DRAFT;
    const updatedInvoice = await updateInvoice(
      invoiceId,
      isDraft ? lineItems : undefined,
      reference,
      isDraft ? invoiceNumber : undefined,
      isDraft || invoiceStatus === Invoice.StatusEnum.AUTHORISED ? dueDate : undefined,
      isDraft ? date : undefined,
      isDraft ? contactId : undefined,
      isDraft || invoiceStatus === Invoice.StatusEnum.AUTHORISED ? currencyRate : undefined,
    );

    if (!updatedInvoice) {
      throw new Error("Invoice update failed.");
    }

    return {
      result: updatedInvoice,
      isError: false,
      error: null,
    };
  } catch (error) {
    return {
      result: null,
      isError: true,
      error: formatError(error),
    };
  }
}
