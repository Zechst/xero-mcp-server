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
The fileName must match an existing attachment — use list-attachments to find it. \
Provide one of: fileUrl (a URL the server will fetch — best for large files), \
filePath (absolute path on the server filesystem), or contentBase64 (base64 string for small files). \
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
    fileUrl: z.string().optional().describe(
      "A URL the server will fetch the file from (e.g. a presigned S3 URL). Preferred for large files — bypasses the context window entirely.",
    ),
    filePath: z.string().optional().describe(
      "Absolute path to the file on the server's filesystem.",
    ),
    contentBase64: z.string().optional().describe(
      "The new file content encoded as a base64 string. Use for small files only (<30KB).",
    ),
  },
  async ({ entityType, entityId, fileName, fileUrl, filePath, contentBase64 }) => {
    const response = await updateXeroAttachment(entityType, entityId, fileName, contentBase64, filePath, fileUrl);
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
