import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { Payment } from "xero-node";
import { getClientHeaders } from "../helpers/get-client-headers.js";

export async function deleteXeroPayment(
  paymentId: string,
): Promise<XeroClientResponse<Payment>> {
  try {
    await xeroClient.authenticate();

    const response = await xeroClient.accountingApi.deletePayment(
      xeroClient.tenantId,
      paymentId,
      { status: "DELETED" },
      undefined,
      getClientHeaders(),
    );

    const payment = response.body.payments?.[0];

    if (!payment) {
      throw new Error("Failed to void payment.");
    }

    return { result: payment, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
