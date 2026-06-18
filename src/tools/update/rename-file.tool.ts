import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { renameXeroFile } from "../../handlers/rename-xero-file.handler.js";

const RenameFileTool = CreateXeroTool(
  "rename-file",
  "Rename a file stored in Xero Files storage. \
Use list-files to find the fileId. \
Note: this only works for files in Xero Files storage — attachments on accounting entities \
(invoices, contacts, etc.) cannot be renamed via the Xero API.",
  {
    fileId: z.string().describe("The ID of the file to rename. Use list-files to find it."),
    newName: z.string().describe("The new filename including extension, e.g. 'invoice-march-2026.pdf'."),
  },
  async ({ fileId, newName }) => {
    const response = await renameXeroFile(fileId, newName);

    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error renaming file: ${response.error}` }] };
    }

    const f = response.result;
    return {
      content: [{
        type: "text" as const,
        text: [
          `File renamed successfully.`,
          `File ID: ${f.id}`,
          `New Name: ${f.name}`,
          f.mimeType ? `Type: ${f.mimeType}` : null,
          f.size ? `Size: ${f.size} bytes` : null,
        ].filter(Boolean).join("\n"),
      }],
    };
  },
);

export default RenameFileTool;
