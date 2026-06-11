import { z } from "zod";
import { deleteXeroPayment } from "../../handlers/delete-xero-payment.handler.js";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";

const DeletePaymentTool = CreateXeroTool(
  "delete-payment",
  "Void (delete) an existing payment in Xero by its ID. \
This marks the payment as DELETED and reverses it against the invoice. \
Use the list-payments tool to find the payment ID.",
  {
    paymentId: z.string().describe("The ID of the payment to void. Can be obtained from the list-payments tool."),
  },
  async ({ paymentId }: { paymentId: string }) => {
    const result = await deleteXeroPayment(paymentId);

    if (result.isError) {
      return {
        content: [{ type: "text" as const, text: `Error voiding payment: ${result.error}` }],
      };
    }

    const payment = result.result;

    return {
      content: [
        {
          type: "text" as const,
          text: [
            "Payment voided successfully:",
            `ID: ${payment.paymentID}`,
            `Amount: ${payment.amount}`,
            `Status: ${payment.status}`,
          ].join("\n"),
        },
      ],
    };
  },
);

export default DeletePaymentTool;
