import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { listXeroFiles } from "../../handlers/list-xero-files.handler.js";

const ListFilesTool = CreateXeroTool(
  "list-files",
  "List files stored in the Xero Files inbox. Returns file ID, name, MIME type, size, folder ID, and dates. \
Use list-folders to find folder IDs. Requires the 'files' OAuth scope.",
  {
    pageSize: z.number().int().min(1).max(100).optional().describe(
      "Number of files to return per page (default: 50, max: 100).",
    ),
    page: z.number().int().min(1).optional().describe(
      "Page number for pagination (1-based).",
    ),
    sort: z.enum(["Name", "Size", "CreatedDateUTC"]).optional().describe(
      "Field to sort results by.",
    ),
  },
  async ({ pageSize, page, sort }) => {
    const response = await listXeroFiles(pageSize, page, sort);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error listing files: ${response.error}` }],
      };
    }

    const { totalCount, items } = response.result;

    if (!items.length) {
      return {
        content: [{ type: "text" as const, text: "No files found." }],
      };
    }

    const lines = items.map((f) =>
      [
        f.name ?? "(unnamed)",
        `  ID: ${f.id}`,
        f.mimeType ? `  MIME: ${f.mimeType}` : null,
        f.size != null ? `  Size: ${f.size} bytes` : null,
        f.folderId ? `  Folder ID: ${f.folderId}` : null,
        f.createdDateUtc ? `  Created: ${f.createdDateUtc}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );

    const header = totalCount != null ? `${totalCount} total file(s)\n\n` : "";
    return {
      content: [{ type: "text" as const, text: header + lines.join("\n\n") }],
    };
  },
);

export default ListFilesTool;
