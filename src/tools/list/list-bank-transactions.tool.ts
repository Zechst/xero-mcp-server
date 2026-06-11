import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { listXeroBankTransactions } from "../../handlers/list-xero-bank-transactions.handler.js";
import { formatLineItem } from "../../helpers/format-line-item.js";

const ListBankTransactionsTool = CreateXeroTool(
  "list-bank-transactions",
  `List bank transactions in Xero.
  Ask the user if they want to see bank transactions for a specific bank account,
  or to see all bank transactions before running.
  Use isReconciled=false to retrieve unmatched/unreconciled transactions only.
  Ask the user if they want the next page after running this tool if
  10 bank transactions are returned.
  If they do, call this tool again with the next page number and the same filters.`,
  {
    page: z.number(),
    bankAccountId: z.string().optional().describe("Filter by a specific bank account ID. Can be obtained from the list-accounts tool."),
    isReconciled: z.boolean().optional().describe("Filter by reconciliation status. Use false to get unmatched transactions, true for reconciled only. Omit to get all."),
  },
  async ({ bankAccountId, page, isReconciled }) => {
    const response = await listXeroBankTransactions(page, bankAccountId, isReconciled);
    if (response.isError) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing bank transactions: ${response.error}`
          }
        ]
      };
    }

    const bankTransactions = response.result;

    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${bankTransactions?.length || 0} bank transactions:`
        },
        ...(bankTransactions?.map((transaction) => ({
          type: "text" as const,
          text: [
            `Bank Transaction ID: ${transaction.bankTransactionID}`,
            `Bank Account: ${transaction.bankAccount.name} (${transaction.bankAccount.accountID})`,
            transaction.contact
              ? `Contact: ${transaction.contact.name} (${transaction.contact.contactID})`
              : null,
            transaction.reference ? `Reference: ${transaction.reference}` : null,
            transaction.date ? `Date: ${transaction.date}` : null,
            transaction.subTotal ? `Sub Total: ${transaction.subTotal}` : null,
            transaction.totalTax ? `Total Tax: ${transaction.totalTax}` : null,
            transaction.total ? `Total: ${transaction.total}` : null,
            transaction.isReconciled !== undefined ? (`${transaction.isReconciled ? "Reconciled" : "Unreconciled"}`) : null,
            transaction.currencyCode ? `Currency Code: ${transaction.currencyCode}` : null,
            `${transaction.status || "Unknown"}`,
            transaction.lineAmountTypes ? `Line Amount Types: ${transaction.lineAmountTypes}` : undefined,
            transaction.hasAttachments !== undefined
              ? (transaction.hasAttachments ? "Has attachments" : "Does not have attachments")
              : null,
            `Line Items: ${transaction.lineItems?.map(formatLineItem)}`,
          ].filter(Boolean).join("\n")
        })) || [])
      ]
    };
  }
);

export default ListBankTransactionsTool;