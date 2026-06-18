import { z } from "zod";
import { updateAuthorisedXeroBill } from "../../handlers/update-authorised-xero-bill.handler.js";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { DeepLinkType, getDeepLink } from "../../helpers/get-deeplink.js";

const trackingSchema = z.object({
  name: z.string().describe("The name of the tracking category. Can be obtained from the list-tracking-categories tool"),
  option: z.string().describe("The name of the tracking option. Can be obtained from the list-tracking-categories tool"),
  trackingCategoryID: z.string().describe("The ID of the tracking category. Can be obtained from the list-tracking-categories tool"),
});

const lineItemSchema = z.object({
  description: z.string().describe("The description of the line item"),
  quantity: z.number().describe("The quantity of the line item"),
  unitAmount: z.number().describe("The price per unit of the line item"),
  accountCode: z.string().describe("The account code of the line item - can be obtained from the list-accounts tool"),
  taxType: z.string().describe("The tax type of the line item - can be obtained from the list-tax-rates tool"),
  itemCode: z.string().optional().describe("The item code of the line item - can be obtained from the list-items tool"),
  tracking: z.array(trackingSchema).optional().describe("Up to 2 tracking categories. Only use if prompted by the user."),
});

const UpdateAuthorisedBillTool = CreateXeroTool(
  "update-authorised-bill",
  "Update an authorised bill (ACCPAY invoice) in Xero. \
Only line items and reference can be changed on an authorised bill. \
Contact, invoice date, and due date cannot be modified via MCP on authorised bills. \
All line items must be provided when updating them; any omitted line items will be removed. \
A deep link to the bill is returned and should be displayed to the user.",
  {
    invoiceId: z.string().describe("The ID of the authorised bill to update. Can be obtained from the list-invoices tool."),
    lineItems: z.array(lineItemSchema).optional().describe(
      "All line items must be provided. Any line items not provided will be removed. Do not modify line items not specified by the user.",
    ),
    reference: z.string().optional().describe("A reference for the bill."),
  },
  async ({
    invoiceId,
    lineItems,
    reference,
  }: {
    invoiceId: string;
    lineItems?: Array<{
      description: string;
      quantity: number;
      unitAmount: number;
      accountCode: string;
      taxType: string;
      itemCode?: string;
    }>;
    reference?: string;
  }) => {
    const result = await updateAuthorisedXeroBill(invoiceId, lineItems, reference, undefined);

    if (result.isError) {
      return {
        content: [{ type: "text" as const, text: `Error updating bill: ${result.error}` }],
      };
    }

    const bill = result.result;
    const deepLink = bill.invoiceID
      ? await getDeepLink(DeepLinkType.BILL, bill.invoiceID)
      : null;

    return {
      content: [
        {
          type: "text" as const,
          text: [
            "Bill updated successfully:",
            `ID: ${bill.invoiceID}`,
            `Contact: ${bill.contact?.name}`,
            `Total: ${bill.total}`,
            `Status: ${bill.status}`,
            `Due Date: ${bill.dueDate}`,
            deepLink ? `Link to view: ${deepLink}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    };
  },
);

export default UpdateAuthorisedBillTool;
