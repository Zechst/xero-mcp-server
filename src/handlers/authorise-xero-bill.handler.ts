import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { Invoice } from "xero-node";
import { getClientHeaders } from "../helpers/get-client-headers.js";

export async function authoriseXeroBill(
  invoiceId: string,
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
      throw new Error(`This tool only authorises bills (ACCPAY). Found type: ${invoice.type}`);
    }

    if (invoice.status === Invoice.StatusEnum.AUTHORISED) {
      throw new Error("Bill is already authorised.");
    }

    if (invoice.status !== Invoice.StatusEnum.DRAFT && invoice.status !== Invoice.StatusEnum.SUBMITTED) {
      throw new Error(`Cannot authorise bill with status: ${invoice.status}`);
    }

    const response = await xeroClient.accountingApi.updateInvoice(
      xeroClient.tenantId,
      invoiceId,
      { invoices: [{ status: Invoice.StatusEnum.AUTHORISED }] },
      undefined,
      undefined,
      getClientHeaders(),
    );

    const updated = response.body.invoices?.[0];

    if (!updated) {
      throw new Error("Failed to authorise bill.");
    }

    return { result: updated, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
