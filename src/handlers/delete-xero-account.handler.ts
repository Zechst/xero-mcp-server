import { Account } from "xero-node";
import { xeroClient } from "../clients/xero-client.js";
import { getClientHeaders } from "../helpers/get-client-headers.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export async function deleteXeroAccount(
  accountId: string,
): Promise<XeroClientResponse<Account>> {
  try {
    await xeroClient.authenticate();

    const response = await xeroClient.accountingApi.deleteAccount(
      xeroClient.tenantId,
      accountId,
      getClientHeaders(),
    );

    const result = response.body.accounts?.[0];
    if (!result) throw new Error("Account deletion failed.");

    return { result, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
