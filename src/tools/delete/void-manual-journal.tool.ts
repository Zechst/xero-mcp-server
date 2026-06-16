import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { voidXeroManualJournal } from "../../handlers/void-xero-manual-journal.handler.js";

const VoidManualJournalTool = CreateXeroTool(
  "void-manual-journal",
  `Void a POSTED manual journal in Xero.
  Only POSTED manual journals can be voided. DRAFT manual journals should be deleted instead.
  Use list-manual-journals to find the manualJournalID.`,
  {
    manualJournalID: z.string().describe("The ID of the manual journal to void."),
  },
  async ({ manualJournalID }) => {
    const response = await voidXeroManualJournal(manualJournalID);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error voiding manual journal: ${response.error}` }],
      };
    }

    return {
      content: [{ type: "text" as const, text: `Manual journal ${manualJournalID} voided successfully.` }],
    };
  },
);

export default VoidManualJournalTool;
