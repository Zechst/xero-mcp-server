import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { ReportWithRow } from "xero-node";
import { getClientHeaders } from "../helpers/get-client-headers.js";

export async function getXeroReportBankSummary(
  fromDate?: string,
  toDate?: string,
): Promise<XeroClientResponse<ReportWithRow>> {
  try {
    await xeroClient.authenticate();
    const response = await xeroClient.accountingApi.getReportBankSummary(
      xeroClient.tenantId,
      fromDate,
      toDate,
      getClientHeaders(),
    );
    const report = response.body.reports?.[0];
    if (!report) {
      return { result: null, isError: true, error: "No bank summary report returned" };
    }
    return { result: report, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
