import { Account, AccountType, Accounts } from "xero-node";
import { xeroClient } from "../clients/xero-client.js";
import { getClientHeaders } from "../helpers/get-client-headers.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export async function updateXeroAccount(
  accountId: string,
  name?: string,
  code?: string,
  description?: string,
  taxType?: string,
  enablePaymentsToAccount?: boolean,
  showInExpenseClaims?: boolean,
  status?: Account.StatusEnum,
): Promise<XeroClientResponse<Account>> {
  try {
    await xeroClient.authenticate();

    const account: Account = {
      name,
      code,
      description,
      taxType,
      enablePaymentsToAccount,
      showInExpenseClaims,
      status,
    };

    const accounts: Accounts = { accounts: [account] };

    const response = await xeroClient.accountingApi.updateAccount(
      xeroClient.tenantId,
      accountId,
      accounts,
      undefined,
      getClientHeaders(),
    );

    const result = response.body.accounts?.[0];
    if (!result) throw new Error("Account update failed.");

    return { result, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
