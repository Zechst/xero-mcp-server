import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { getXeroReportBankSummary } from "../../handlers/get-xero-report-bank-summary.handler.js";
import { RowType } from "xero-node";

const GetReportBankSummaryTool = CreateXeroTool(
  "get-report-bank-summary",
  "Get the Bank Summary report from Xero. Shows opening balance, cash received, cash spent, \
and closing balance for each bank account over a date range.",
  {
    fromDate: z.string().optional().describe("Start date in YYYY-MM-DD format."),
    toDate: z.string().optional().describe("End date in YYYY-MM-DD format."),
  },
  async ({ fromDate, toDate }) => {
    const response = await getXeroReportBankSummary(fromDate, toDate);
    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error fetching bank summary: ${response.error}` }] };
    }

    const report = response.result;

    // Flatten rows into readable text
    const lines: string[] = [`Bank Summary Report: ${report.reportName ?? ""}`];
    if (report.reportDate) lines.push(`Report Date: ${report.reportDate}`);
    if (fromDate || toDate) lines.push(`Period: ${fromDate ?? ""} → ${toDate ?? ""}`);
    lines.push("");

    for (const row of report.rows ?? []) {
      if (row.rowType === RowType.Header && row.cells) {
        lines.push(row.cells.map((c) => c.value ?? "").join(" | "));
        lines.push("─".repeat(80));
      } else if (row.rowType === RowType.Section) {
        if (row.title) lines.push(`\n${row.title}`);
        for (const inner of row.rows ?? []) {
          if (inner.cells) {
            lines.push(inner.cells.map((c) => c.value ?? "").join(" | "));
          }
        }
      } else if (row.rowType === RowType.SummaryRow && row.cells) {
        lines.push("─".repeat(80));
        lines.push(row.cells.map((c) => c.value ?? "").join(" | "));
      } else if (row.cells) {
        lines.push(row.cells.map((c) => c.value ?? "").join(" | "));
      }
    }

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  },
);

export default GetReportBankSummaryTool;
