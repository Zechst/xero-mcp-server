import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { getXeroInvoice } from "../../handlers/get-xero-invoice.handler.js";
import { formatLineItem } from "../../helpers/format-line-item.js";

const GetInvoiceTool = CreateXeroTool(
  "get-invoice",
  "Fetch a single Xero bill or invoice by its UUID. Returns full details including all line items \
regardless of status (Draft, Authorised, Paid, Voided). Use this when you need line item \
descriptions for a PAID bill or invoice — list-invoices may return summary data only for paid records.",
  {
    invoiceId: z.string().describe(
      "The UUID of the bill or invoice (invoiceID field from list-invoices).",
    ),
  },
  async ({ invoiceId }) => {
    const response = await getXeroInvoice(invoiceId);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error fetching invoice: ${response.error}` }],
      };
    }

    const invoice = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [
            `Invoice ID: ${invoice.invoiceID}`,
            `Invoice Number: ${invoice.invoiceNumber}`,
            invoice.reference ? `Reference: ${invoice.reference}` : null,
            `Type: ${invoice.type}`,
            `Status: ${invoice.status}`,
            invoice.contact
              ? `Contact: ${invoice.contact.name} (${invoice.contact.contactID})`
              : null,
            invoice.date ? `Date: ${invoice.date}` : null,
            invoice.dueDate ? `Due Date: ${invoice.dueDate}` : null,
            invoice.lineAmountTypes ? `Line Amount Types: ${invoice.lineAmountTypes}` : null,
            invoice.subTotal ? `Sub Total: ${invoice.subTotal}` : null,
            invoice.totalTax ? `Total Tax: ${invoice.totalTax}` : null,
            `Total: ${invoice.total ?? 0}`,
            invoice.currencyCode ? `Currency: ${invoice.currencyCode}` : null,
            invoice.currencyRate ? `Currency Rate: ${invoice.currencyRate}` : null,
            invoice.amountDue ? `Amount Due: ${invoice.amountDue}` : null,
            invoice.amountPaid ? `Amount Paid: ${invoice.amountPaid}` : null,
            invoice.amountCredited ? `Amount Credited: ${invoice.amountCredited}` : null,
            invoice.fullyPaidOnDate ? `Fully Paid On: ${invoice.fullyPaidOnDate}` : null,
            invoice.updatedDateUTC ? `Last Updated: ${invoice.updatedDateUTC}` : null,
            invoice.lineItems?.length
              ? `\nLine Items:\n${invoice.lineItems.map(formatLineItem).join("\n\n")}`
              : "Line Items: (none)",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    };
  },
);

export default GetInvoiceTool;
