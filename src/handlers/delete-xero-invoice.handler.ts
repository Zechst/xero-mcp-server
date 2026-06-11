import { xeroClient } from "../clients/xero-client.js";
import { Invoice } from "xero-node";
import { getClientHeaders } from "../helpers/get-client-headers.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export async function deleteXeroInvoice(
  invoiceId: string,
): Promise<XeroClientResponse<string>> {
  try {
    await xeroClient.authenticate();

    await xeroClient.accountingApi.updateInvoice(
      xeroClient.tenantId,
      invoiceId,
      {
        invoices: [
          {
            invoiceID: invoiceId,
            status: Invoice.StatusEnum.DELETED,
          },
        ],
      },
      undefined,
      undefined,
      getClientHeaders(),
    );

    return {
      result: invoiceId,
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
