import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { createXeroAccount } from "../../handlers/create-xero-account.handler.js";
import { Account, AccountType } from "xero-node";

const ACCOUNT_TYPES = [
  "BANK", "CURRENT", "CURRLIAB", "DEPRECIATN", "DIRECTCOSTS",
  "EQUITY", "EXPENSE", "FIXED", "INVENTORY", "LIABILITY",
  "NONCURRENT", "OTHERINCOME", "OVERHEADS", "PREPAYMENT",
  "REVENUE", "SALES", "TERMLIAB", "PAYG",
] as const;

const CreateAccountTool = CreateXeroTool(
  "create-account",
  "Create a new GL account in the Xero Chart of Accounts. \
Use list-accounts to check for existing accounts before creating. \
For bank accounts, bankAccountNumber and bankAccountType are required.",
  {
    name: z.string().describe("Name of the account (max 150 chars)."),
    type: z.enum(ACCOUNT_TYPES).describe(
      "Account type. Common: BANK, CURRENT (current asset), CURRLIAB (current liability), \
EXPENSE, FIXED (fixed asset), REVENUE, SALES, EQUITY, OVERHEADS, DIRECTCOSTS, NONCURRENT, TERMLIAB, DEPRECIATN, INVENTORY."
    ),
    code: z.string().optional().describe("Account code (max 10 chars, e.g. '200' or 'SALES'). Must be unique."),
    description: z.string().optional().describe("Description of the account (max 4000 chars). Not valid for bank accounts."),
    taxType: z.string().optional().describe("Tax type for the account. Use list-tax-rates to find valid tax types."),
    enablePaymentsToAccount: z.boolean().optional().describe("Whether payments can be applied to this account."),
    showInExpenseClaims: z.boolean().optional().describe("Whether this account appears in expense claims."),
    bankAccountNumber: z.string().optional().describe("Bank account number. Required for BANK type accounts."),
    bankAccountType: z.enum(["BANK", "CREDITCARD", "PAYPAL"]).optional().describe("Bank account type. Required for BANK type accounts."),
    currencyCode: z.string().optional().describe("ISO 4217 currency code. Only for bank accounts in a non-base currency."),
  },
  async ({ name, type, code, description, taxType, enablePaymentsToAccount, showInExpenseClaims, bankAccountNumber, bankAccountType, currencyCode }) => {
    const response = await createXeroAccount(
      name,
      type as unknown as AccountType,
      code,
      description,
      taxType,
      enablePaymentsToAccount,
      showInExpenseClaims,
      bankAccountNumber,
      bankAccountType as Account.BankAccountTypeEnum | undefined,
      currencyCode,
    );

    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error creating account: ${response.error}` }] };
    }

    const a = response.result;
    return {
      content: [{
        type: "text" as const,
        text: [
          `Account created successfully.`,
          `Account ID: ${a.accountID}`,
          `Name: ${a.name}`,
          a.code ? `Code: ${a.code}` : null,
          `Type: ${a.type}`,
          `Status: ${a.status}`,
          a.taxType ? `Tax Type: ${a.taxType}` : null,
          a._class ? `Class: ${a._class}` : null,
        ].filter(Boolean).join("\n"),
      }],
    };
  },
);

export default CreateAccountTool;
