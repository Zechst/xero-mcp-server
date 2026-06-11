import { z } from "zod";
import { authoriseXeroBill } from "../../handlers/authorise-xero-bill.handler.js";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { DeepLinkType, getDeepLink } from "../../helpers/get-deeplink.js";

const AuthoriseBillTool = CreateXeroTool(
  "authorise-bill",
  "Authorise a draft or submitted bill (ACCPAY invoice) in Xero. \
Once authorised, the bill is approved for payment. \
A deep link to the bill is returned and should be displayed to the user.",
  {
    invoiceId: z.string().describe("The ID of the bill to authorise. Can be obtained from the list-invoices tool."),
  },
  async ({ invoiceId }: { invoiceId: string }) => {
    const result = await authoriseXeroBill(invoiceId);

    if (result.isError) {
      return {
        content: [{ type: "text" as const, text: `Error authorising bill: ${result.error}` }],
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
            "Bill authorised successfully:",
            `ID: ${bill.invoiceID}`,
            `Contact: ${bill.contact?.name}`,
            `Total: ${bill.total}`,
            `Status: ${bill.status}`,
            deepLink ? `Link to view: ${deepLink}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    };
  },
);

export default AuthoriseBillTool;
