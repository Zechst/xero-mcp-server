import { xeroClient } from "../clients/xero-client.js";
import { HistoryRecords, HistoryRecord } from "xero-node";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { getClientHeaders } from "../helpers/get-client-headers.js";

export async function addXeroInvoiceNote(
  invoiceId: string,
  note: string,
): Promise<XeroClientResponse<HistoryRecord[]>> {
  try {
    await xeroClient.authenticate();
    const api = xeroClient.accountingApi;
    const tenantId = xeroClient.tenantId;
    const headers = getClientHeaders();

    const historyRecords: HistoryRecords = {
      historyRecords: [{ details: note }],
    };

    const response = await api.createInvoiceHistory(tenantId, invoiceId, historyRecords, undefined, headers);
    return { result: response.body.historyRecords ?? [], isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
