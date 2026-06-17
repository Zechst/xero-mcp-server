import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { updateXeroAccount } from "../../handlers/update-xero-account.handler.js";
import { Account } from "xero-node";

const UpdateAccountTool = CreateXeroTool(
  "update-account",
  "Update an existing GL account in the Xero Chart of Accounts. \
Use get-account to retrieve current values before updating. \
System accounts cannot be deleted but can be archived. \
Only pass fields you want to change.",
  {
    accountId: z.string().describe("The UUID of the account to update (accountID from list-accounts or get-account)."),
    name: z.string().optional().describe("New name for the account (max 150 chars)."),
    code: z.string().optional().describe("New account code (max 10 chars). Must be unique."),
    description: z.string().optional().describe("New description (max 4000 chars). Not valid for bank accounts."),
    taxType: z.string().optional().describe("Tax type. Use list-tax-rates to find valid values."),
    enablePaymentsToAccount: z.boolean().optional().describe("Whether payments can be applied to this account."),
    showInExpenseClaims: z.boolean().optional().describe("Whether this account appears in expense claims."),
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional().describe("Set to ARCHIVED to deactivate the account. ACTIVE to reactivate."),
  },
  async ({ accountId, name, code, description, taxType, enablePaymentsToAccount, showInExpenseClaims, status }) => {
    const response = await updateXeroAccount(
      accountId,
      name,
      code,
      description,
      taxType,
      enablePaymentsToAccount,
      showInExpenseClaims,
      status as Account.StatusEnum | undefined,
    );

    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error updating account: ${response.error}` }] };
    }

    const a = response.result;
    return {
      content: [{
        type: "text" as const,
        text: [
          `Account updated successfully.`,
          `Account ID: ${a.accountID}`,
          `Name: ${a.name}`,
          a.code ? `Code: ${a.code}` : null,
          `Type: ${a.type}`,
          `Status: ${a.status}`,
          a.taxType ? `Tax Type: ${a.taxType}` : null,
        ].filter(Boolean).join("\n"),
      }],
    };
  },
);

export default UpdateAccountTool;
