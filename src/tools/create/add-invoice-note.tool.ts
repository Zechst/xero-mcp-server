import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { addXeroInvoiceNote } from "../../handlers/add-xero-invoice-note.handler.js";

const AddInvoiceNoteTool = CreateXeroTool(
  "add-invoice-note",
  "Add a note to a Xero bill or invoice (visible in History & Notes). \
Works for both bills (ACCPAY) and invoices (ACCREC). Use list-invoices to find the invoice ID.",
  {
    invoiceId: z.string().describe(
      "The ID of the bill or invoice to add the note to.",
    ),
    note: z.string().describe(
      "The note text to add.",
    ),
  },
  async ({ invoiceId, note }) => {
    const response = await addXeroInvoiceNote(invoiceId, note);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error adding note: ${response.error}` }],
      };
    }
    const record = response.result[0];
    return {
      content: [
        {
          type: "text" as const,
          text: [
            "Note added successfully:",
            record?.details ? `Note: ${record.details}` : null,
            record?.dateUTC ? `Date: ${record.dateUTC}` : null,
            record?.user ? `User: ${record.user}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    };
  },
);

export default AddInvoiceNoteTool;
