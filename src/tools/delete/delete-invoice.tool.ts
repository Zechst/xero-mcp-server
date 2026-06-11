import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { deleteXeroInvoice } from "../../handlers/delete-xero-invoice.handler.js";

const DeleteInvoiceTool = CreateXeroTool(
  "delete-invoice",
  `Delete a DRAFT invoice or bill in Xero.
  Only DRAFT invoices can be deleted. AUTHORISED invoices must be voided instead.
  The invoice ID can be obtained from the list-invoices tool.`,
  {
    invoiceId: z.string().describe("The ID of the invoice or bill to delete."),
  },
  async ({ invoiceId }) => {
    const response = await deleteXeroInvoice(invoiceId);
    if (response.isError) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error deleting invoice: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Invoice ${invoiceId} deleted successfully.`,
        },
      ],
    };
  },
);

export default DeleteInvoiceTool;
