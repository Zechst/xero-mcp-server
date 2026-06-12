import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { updateXeroAttachment } from "../../handlers/update-xero-attachment.handler.js";

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

const UpdateAttachmentTool = CreateXeroTool(
  "update-attachment",
  "Replace an existing file attachment on a Xero entity by filename. \
The file content must be provided as a base64-encoded string. \
The fileName must match an existing attachment — use list-attachments to find it. \
Returns the updated attachment metadata.",
  {
    entityType: z.enum(ENTITY_TYPES).describe(
      "The type of Xero entity the attachment belongs to.",
    ),
    entityId: z.string().describe(
      "The ID of the entity the attachment belongs to.",
    ),
    fileName: z.string().describe(
      "The filename of the existing attachment to replace, e.g. 'invoice.pdf'. Must match exactly.",
    ),
    contentBase64: z.string().describe(
      "The new file content encoded as a base64 string.",
    ),
  },
  async ({ entityType, entityId, fileName, contentBase64 }) => {
    const response = await updateXeroAttachment(entityType, entityId, fileName, contentBase64);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error updating attachment: ${response.error}` }],
      };
    }

    const a = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [
            "Attachment updated successfully:",
            `Attachment ID: ${a.attachmentID}`,
            `File Name: ${a.fileName}`,
            a.mimeType ? `MIME Type: ${a.mimeType}` : null,
            a.contentLength ? `Size: ${a.contentLength} bytes` : null,
            a.url ? `URL: ${a.url}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    };
  },
);

export default UpdateAttachmentTool;
