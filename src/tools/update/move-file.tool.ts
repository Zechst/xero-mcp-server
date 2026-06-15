import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { moveXeroFile } from "../../handlers/move-xero-file.handler.js";

const MoveFileTool = CreateXeroTool(
  "move-file",
  "Move a file to a different folder in Xero Files storage. \
Use list-files to find the fileId and list-folders to find the target folderId. \
Requires the 'files' OAuth scope.",
  {
    fileId: z.string().describe("The ID of the file to move."),
    folderId: z.string().describe("The ID of the destination folder."),
  },
  async ({ fileId, folderId }) => {
    const response = await moveXeroFile(fileId, folderId);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error moving file: ${response.error}` }],
      };
    }
    const f = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [
            "File moved successfully:",
            `Name: ${f.name}`,
            `ID: ${f.id}`,
            `Folder ID: ${f.folderId}`,
          ].join("\n"),
        },
      ],
    };
  },
);

export default MoveFileTool;
