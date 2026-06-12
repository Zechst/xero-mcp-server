import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { listXeroAttachments } from "../../handlers/list-xero-attachments.handler.js";

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

const ListAttachmentsTool = CreateXeroTool(
  "list-attachments",
  "List all attachments on a Xero entity (Invoice, Contact, CreditNote, etc.). \
Returns attachment metadata including ID, filename, MIME type, size, and URL.",
  {
    entityType: z.enum(ENTITY_TYPES).describe(
      "The type of Xero entity to list attachments for.",
    ),
    entityId: z.string().describe(
      "The ID of the entity. For example, an invoice ID from list-invoices, a contact ID from list-contacts, etc.",
    ),
  },
  async ({ entityType, entityId }) => {
    const response = await listXeroAttachments(entityType, entityId);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error listing attachments: ${response.error}` }],
      };
    }

    const attachments = response.result;
    if (!attachments.length) {
      return {
        content: [{ type: "text" as const, text: `No attachments found on ${entityType} ${entityId}.` }],
      };
    }

    return {
      content: [
        { type: "text" as const, text: `Found ${attachments.length} attachment(s) on ${entityType} ${entityId}:` },
        ...attachments.map((a) => ({
          type: "text" as const,
          text: [
            `Attachment ID: ${a.attachmentID}`,
            `File Name: ${a.fileName}`,
            a.mimeType ? `MIME Type: ${a.mimeType}` : null,
            a.contentLength ? `Size: ${a.contentLength} bytes` : null,
            a.includeOnline ? `Include Online: Yes` : null,
            a.url ? `URL: ${a.url}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        })),
      ],
    };
  },
);

export default ListAttachmentsTool;
