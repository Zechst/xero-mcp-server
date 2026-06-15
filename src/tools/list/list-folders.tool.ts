import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { listXeroFolders } from "../../handlers/list-xero-folders.handler.js";

const ListFoldersTool = CreateXeroTool(
  "list-folders",
  "List all folders in the Xero Files storage, including the Inbox. \
Returns each folder's ID, name, file count, and (for the Inbox) the email-to-inbox address. \
Requires the 'files' OAuth scope.",
  {},
  async () => {
    const response = await listXeroFolders();
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error listing folders: ${response.error}` }],
      };
    }

    const folders = response.result;
    if (!folders.length) {
      return {
        content: [{ type: "text" as const, text: "No folders found." }],
      };
    }

    const lines = folders.map((f) => {
      const parts = [
        `${f.isInbox ? "[Inbox] " : ""}${f.name ?? "(unnamed)"}`,
        `  ID: ${f.id}`,
        `  Files: ${f.fileCount ?? 0}`,
      ];
      if (f.email) parts.push(`  Email-to-inbox: ${f.email}`);
      return parts.join("\n");
    });

    return {
      content: [{ type: "text" as const, text: lines.join("\n\n") }],
    };
  },
);

export default ListFoldersTool;
