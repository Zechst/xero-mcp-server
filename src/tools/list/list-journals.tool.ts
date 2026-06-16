import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { listXeroJournals } from "../../handlers/list-xero-journals.handler.js";

const ListJournalsTool = CreateXeroTool(
  "list-journals",
  "List journal entries from Xero. Each journal represents a double-entry posting (e.g. from an invoice, \
payment, manual journal, or bank transaction). Use this to drill into what moved through a specific account — \
filter the returned journalLines by accountID or accountCode. \
Xero returns up to 100 journals per call ordered by journalNumber. Use 'offset' to paginate \
(e.g. offset=100 for the second page). To filter by account, fetch journals and look for lines \
where accountCode or accountID matches the account of interest.",
  {
    offset: z.number().optional().describe(
      "Offset for pagination. Xero returns 100 journals per page. Pass 100 for page 2, 200 for page 3, etc.",
    ),
    paymentsOnly: z.boolean().optional().describe(
      "If true, returns only journals created by a payment (ACCRECPAYMENT, ACCPAYPAYMENT, etc.).",
    ),
    filterAccountCode: z.string().optional().describe(
      "Optional: only return journals that contain a line for this account code (e.g. '630'). Filtered client-side.",
    ),
    filterAccountId: z.string().optional().describe(
      "Optional: only return journals that contain a line for this account UUID. Filtered client-side.",
    ),
  },
  async ({ offset, paymentsOnly, filterAccountCode, filterAccountId }) => {
    const response = await listXeroJournals(offset, paymentsOnly);
    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error listing journals: ${response.error}` }] };
    }

    let journals = response.result ?? [];

    // Client-side account filter
    if (filterAccountCode || filterAccountId) {
      journals = journals.filter((j) =>
        j.journalLines?.some(
          (l) =>
            (filterAccountCode && l.accountCode === filterAccountCode) ||
            (filterAccountId && l.accountID === filterAccountId),
        ),
      );
    }

    if (journals.length === 0) {
      return { content: [{ type: "text" as const, text: "No journals found matching the criteria." }] };
    }

    return {
      content: [
        { type: "text" as const, text: `Found ${journals.length} journals (offset ${offset ?? 0}):` },
        ...journals.map((j) => ({
          type: "text" as const,
          text: [
            `Journal #${j.journalNumber} | ID: ${j.journalID}`,
            `Date: ${j.journalDate}`,
            j.sourceType ? `Source: ${j.sourceType}` : null,
            j.sourceID ? `Source ID: ${j.sourceID}` : null,
            j.reference ? `Reference: ${j.reference}` : null,
            j.createdDateUTC ? `Created: ${j.createdDateUTC}` : null,
            "Lines:",
            ...(j.journalLines?.map((l) =>
              `  ${l.accountCode ?? ""} ${l.accountName ?? ""} | Net: ${l.netAmount ?? 0} | Tax: ${l.taxAmount ?? 0} | Gross: ${l.grossAmount ?? 0}${l.description ? ` | ${l.description}` : ""}`,
            ) ?? []),
          ].filter(Boolean).join("\n"),
        })),
      ],
    };
  },
);

export default ListJournalsTool;
