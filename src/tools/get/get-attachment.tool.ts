import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { getXeroAttachment } from "../../handlers/get-xero-attachment.handler.js";

const ENTITY_TYPES = [
  "Accounts",
  "BankTransactions",
  "BankTransfers",
  "Contacts",
  "CreditNotes",
  "Invoices",
  "ManualJournals",
  "PurchaseOrders",
  "Quotes",
  "Receipts",
  "RepeatingInvoices",
] as const;

const GetAttachmentTool = CreateXeroTool(
  "get-attachment",
  "Download the content of a file attachment from a Xero entity by filename. \
Use list-attachments first to find the fileName and mimeType. \
Returns the file content as a base64-encoded string.",
  {
    entityType: z.enum(ENTITY_TYPES).describe(
      "The type of Xero entity the attachment belongs to.",
    ),
    entityId: z.string().describe(
      "The ID of the entity the attachment belongs to.",
    ),
    fileName: z.string().describe(
      "The filename of the attachment to download, e.g. 'invoice.pdf'. Use list-attachments to find it.",
    ),
    mimeType: z.string().describe(
      "The MIME type of the attachment, e.g. 'application/pdf' or 'image/jpeg'. Use list-attachments to find it.",
    ),
  },
  async ({ entityType, entityId, fileName, mimeType }) => {
    const response = await getXeroAttachment(entityType, entityId, fileName, mimeType);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error downloading attachment: ${response.error}` }],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: [
            `Attachment downloaded successfully:`,
            `File Name: ${fileName}`,
            `MIME Type: ${mimeType}`,
            `Content (base64): ${response.result}`,
          ].join("\n"),
        },
      ],
    };
  },
);

export default GetAttachmentTool;
