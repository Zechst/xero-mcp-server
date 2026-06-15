import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { createXeroFolder } from "../../handlers/create-xero-folder.handler.js";

const CreateFolderTool = CreateXeroTool(
  "create-folder",
  "Create a new folder in the Xero Files storage. Returns the new folder's ID and name. \
Requires the 'files' OAuth scope.",
  {
    name: z.string().describe("The name of the new folder."),
  },
  async ({ name }) => {
    const response = await createXeroFolder(name);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error creating folder: ${response.error}` }],
      };
    }
    const f = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [`Folder created:`, `Name: ${f.name}`, `ID: ${f.id}`].join("\n"),
        },
      ],
    };
  },
);

export default CreateFolderTool;
