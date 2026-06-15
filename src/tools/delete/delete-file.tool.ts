import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { deleteXeroFile } from "../../handlers/delete-xero-file.handler.js";

const DeleteFileTool = CreateXeroTool(
  "delete-file",
  "Permanently delete a file from Xero Files storage by its file ID. \
Use list-files to find file IDs. Requires the 'files' OAuth scope.",
  {
    fileId: z.string().describe("The Xero file ID to delete."),
  },
  async ({ fileId }) => {
    const response = await deleteXeroFile(fileId);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error deleting file: ${response.error}` }],
      };
    }
    return {
      content: [{ type: "text" as const, text: `File ${fileId} deleted successfully.` }],
    };
  },
);

export default DeleteFileTool;
