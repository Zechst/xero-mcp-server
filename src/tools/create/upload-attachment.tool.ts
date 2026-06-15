import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { uploadXeroAttachment } from "../../handlers/upload-xero-attachment.handler.js";

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

const UploadAttachmentTool = CreateXeroTool(
  "upload-attachment",
  "Upload a file attachment to a Xero entity (Invoice, Contact, CreditNote, etc.). \
Provide one of: fileUrl (a URL the server will fetch — best for large files), \
filePath (absolute path on the server filesystem), or contentBase64 (base64 string for small files). \
Returns the created attachment metadata including its ID and URL.",
  {
    entityType: z.enum(ENTITY_TYPES).describe(
      "The type of Xero entity to attach the file to.",
    ),
    entityId: z.string().describe(
      "The ID of the entity. For example, an invoice ID from list-invoices, a contact ID from list-contacts, etc.",
    ),
    fileName: z.string().describe(
      "The name of the file including extension, e.g. 'invoice.pdf' or 'receipt.jpg'.",
    ),
    fileUrl: z.string().optional().describe(
      "A URL the server will fetch the file from (e.g. a presigned S3 URL). Preferred for large files — bypasses the context window entirely.",
    ),
    filePath: z.string().optional().describe(
      "Absolute path to the file on the server's filesystem.",
    ),
    contentBase64: z.string().optional().describe(
      "The file content encoded as a base64 string. Use for small files only (<30KB).",
    ),
    includeOnline: z.boolean().optional().describe(
      "For Invoices and CreditNotes only: whether to include this attachment when the document is sent online. Defaults to false.",
    ),
  },
  async ({ entityType, entityId, fileName, fileUrl, filePath, contentBase64, includeOnline }) => {
    const response = await uploadXeroAttachment(entityType, entityId, fileName, contentBase64, includeOnline, filePath, fileUrl);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error uploading attachment: ${response.error}` }],
      };
    }

    const a = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [
            "Attachment uploaded successfully:",
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

export default UploadAttachmentTool;
