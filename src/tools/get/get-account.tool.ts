import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { getXeroAccount } from "../../handlers/get-xero-account.handler.js";

const GetAccountTool = CreateXeroTool(
  "get-account",
  "Fetch a single Xero GL account by its UUID. Returns full details including type, tax type, currency, \
and whether it is system-generated. Use list-accounts to find the accountID.",
  {
    accountId: z.string().describe("The UUID of the account (accountID from list-accounts)."),
  },
  async ({ accountId }) => {
    const response = await getXeroAccount(accountId);
    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error fetching account: ${response.error}` }] };
    }

    const a = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [
            `Account ID: ${a.accountID}`,
            `Name: ${a.name}`,
            a.code ? `Code: ${a.code}` : null,
            `Type: ${a.type}`,
            `Status: ${a.status}`,
            a.description ? `Description: ${a.description}` : null,
            a.taxType ? `Tax Type: ${a.taxType}` : null,
            a.currencyCode ? `Currency: ${a.currencyCode}` : null,
            a.enablePaymentsToAccount !== undefined ? `Payments Enabled: ${a.enablePaymentsToAccount}` : null,
            a.showInExpenseClaims !== undefined ? `Show in Expense Claims: ${a.showInExpenseClaims}` : null,
            a._class ? `Class: ${a._class}` : null,
            a.systemAccount ? `System Account: ${a.systemAccount}` : null,
            a.reportingCode ? `Reporting Code: ${a.reportingCode}` : null,
            a.reportingCodeName ? `Reporting Code Name: ${a.reportingCodeName}` : null,
            a.hasAttachments !== undefined ? `Has Attachments: ${a.hasAttachments}` : null,
            a.updatedDateUTC ? `Last Updated: ${a.updatedDateUTC}` : null,
          ].filter(Boolean).join("\n"),
        },
      ],
    };
  },
);

export default GetAccountTool;
