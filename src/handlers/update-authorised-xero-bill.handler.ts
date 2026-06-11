import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { Invoice, LineItemTracking } from "xero-node";
import { getClientHeaders } from "../helpers/get-client-headers.js";

interface BillLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  accountCode: string;
  taxType: string;
  itemCode?: string;
  tracking?: LineItemTracking[];
}

export async function updateAuthorisedXeroBill(
  invoiceId: string,
  lineItems?: BillLineItem[],
  reference?: string,
  dueDate?: string,
): Promise<XeroClientResponse<Invoice>> {
  try {
    await xeroClient.authenticate();

    const existing = await xeroClient.accountingApi.getInvoice(
      xeroClient.tenantId,
      invoiceId,
      undefined,
      getClientHeaders(),
    );

    const invoice = existing.body.invoices?.[0];

    if (!invoice) {
      throw new Error("Bill not found.");
    }

    if (invoice.type !== Invoice.TypeEnum.ACCPAY) {
      throw new Error(`This tool only updates bills (ACCPAY). Found type: ${invoice.type}`);
    }

    if (invoice.status !== Invoice.StatusEnum.AUTHORISED) {
      throw new Error(`Bill must be AUTHORISED to use this tool. Current status: ${invoice.status}`);
    }

    const response = await xeroClient.accountingApi.updateInvoice(
      xeroClient.tenantId,
      invoiceId,
      {
        invoices: [
          {
            lineItems: lineItems ?? invoice.lineItems,
            reference: reference ?? invoice.reference,
            dueDate: dueDate ?? invoice.dueDate,
          },
        ],
      },
      undefined,
      undefined,
      getClientHeaders(),
    );

    const updated = response.body.invoices?.[0];

    if (!updated) {
      throw new Error("Failed to update bill.");
    }

    return { result: updated, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
