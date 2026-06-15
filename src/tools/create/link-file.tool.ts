import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { createXeroFileAssociation, ObjectType } from "../../handlers/create-xero-file-association.handler.js";

const OBJECT_TYPES = {
  Bill:            ObjectType.Accpay,
  Invoice:         ObjectType.AccRec,
  Contact:         ObjectType.Contact,
  CreditNote_AP:   ObjectType.AccPayCredit,
  CreditNote_AR:   ObjectType.AccRecCredit,
  ManualJournal:   ObjectType.ManJournal,
  PurchaseOrder:   ObjectType.PurchaseOrder,
  Quote:           ObjectType.SalesQuote,
  Receipt:         ObjectType.Receipt,
  BankTransaction: ObjectType.CashPaid,
} as const;

type ObjectTypeName = keyof typeof OBJECT_TYPES;

const LinkFileTool = CreateXeroTool(
  "link-file",
  "Link an existing Xero Files file to an accounting entity (Bill, Invoice, Contact, etc.) \
without re-uploading. Use list-files or upload-file to get the fileId first. \
The file appears as an attachment on the entity in Xero.",
  {
    fileId: z.string().describe(
      "The Xero Files file ID to link (from list-files or upload-file).",
    ),
    objectId: z.string().describe(
      "The ID of the accounting entity to link to (e.g. InvoiceID, ContactID).",
    ),
    objectType: z.enum([
      "Bill",
      "Invoice",
      "Contact",
      "CreditNote_AP",
      "CreditNote_AR",
      "ManualJournal",
      "PurchaseOrder",
      "Quote",
      "Receipt",
      "BankTransaction",
    ] as const).describe(
      "The type of accounting entity. Use 'Bill' for accounts-payable invoices, 'Invoice' for accounts-receivable invoices.",
    ),
    sendWithObject: z.boolean().optional().describe(
      "Whether to include this file when the document is sent to the client (e.g. emailed invoice). Defaults to false.",
    ),
  },
  async ({ fileId, objectId, objectType, sendWithObject }) => {
    const xeroObjectType = OBJECT_TYPES[objectType as ObjectTypeName];
    const response = await createXeroFileAssociation(fileId, objectId, xeroObjectType, sendWithObject);

    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error linking file: ${response.error}` }],
      };
    }

    const a = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [
            "File linked successfully:",
            a.fileId ? `File ID: ${a.fileId}` : `File ID: ${fileId}`,
            a.objectId ? `Object ID: ${a.objectId}` : `Object ID: ${objectId}`,
            `Object Type: ${objectType}`,
            a.name ? `File Name: ${a.name}` : null,
            a.size != null ? `Size: ${a.size} bytes` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    };
  },
);

export default LinkFileTool;
