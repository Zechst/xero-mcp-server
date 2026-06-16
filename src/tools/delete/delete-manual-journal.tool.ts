import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { deleteXeroManualJournal } from "../../handlers/delete-xero-manual-journal.handler.js";

const DeleteManualJournalTool = CreateXeroTool(
  "delete-manual-journal",
  `Delete a DRAFT manual journal in Xero.
  Only DRAFT manual journals can be deleted. POSTED manual journals must be voided instead.
  Use list-manual-journals to find the manualJournalID.`,
  {
    manualJournalID: z.string().describe("The ID of the manual journal to delete."),
  },
  async ({ manualJournalID }) => {
    const response = await deleteXeroManualJournal(manualJournalID);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error deleting manual journal: ${response.error}` }],
      };
    }

    return {
      content: [{ type: "text" as const, text: `Manual journal ${manualJournalID} deleted successfully.` }],
    };
  },
);

export default DeleteManualJournalTool;
