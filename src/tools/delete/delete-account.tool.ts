import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { deleteXeroAccount } from "../../handlers/delete-xero-account.handler.js";

const DeleteAccountTool = CreateXeroTool(
  "delete-account",
  "Delete a GL account from the Xero Chart of Accounts. \
Only accounts with no transactions can be deleted. \
System accounts and accounts with transactions cannot be deleted — use update-account to archive them instead. \
Use get-account to check the account before deleting.",
  {
    accountId: z.string().describe("The UUID of the account to delete (accountID from list-accounts or get-account)."),
  },
  async ({ accountId }) => {
    const response = await deleteXeroAccount(accountId);

    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error deleting account: ${response.error}` }] };
    }

    return {
      content: [{ type: "text" as const, text: `Account ${accountId} deleted successfully.` }],
    };
  },
);

export default DeleteAccountTool;
