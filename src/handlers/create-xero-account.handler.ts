import { Account, AccountType, Accounts } from "xero-node";
import { xeroClient } from "../clients/xero-client.js";
import { getClientHeaders } from "../helpers/get-client-headers.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export async function createXeroAccount(
  name: string,
  type: AccountType,
  code?: string,
  description?: string,
  taxType?: string,
  enablePaymentsToAccount?: boolean,
  showInExpenseClaims?: boolean,
  bankAccountNumber?: string,
  bankAccountType?: Account.BankAccountTypeEnum,
  currencyCode?: string,
): Promise<XeroClientResponse<Account>> {
  try {
    await xeroClient.authenticate();

    const account: Account = {
      name,
      type,
      code,
      description,
      taxType,
      enablePaymentsToAccount,
      showInExpenseClaims,
      bankAccountNumber,
      bankAccountType,
      ...(currencyCode ? { currencyCode: currencyCode as unknown as any } : {}),
    };

    const response = await xeroClient.accountingApi.createAccount(
      xeroClient.tenantId,
      account,
      undefined,
      getClientHeaders(),
    );

    const result = response.body.accounts?.[0];
    if (!result) throw new Error("Account creation failed.");

    return { result, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
