import fs from "fs";
import path from "path";
import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";

const TEMP_DIR = "/tmp/xero-uploads";

const DeleteTempFileTool = CreateXeroTool(
  "delete-temp-file",
  "Delete a temporary file previously uploaded to the server via the /upload-temp endpoint. \
Call this after a successful upload-attachment or update-attachment to clean up the temp file.",
  {
    tempPath: z.string().describe(
      "The absolute path returned by the /upload-temp endpoint, e.g. '/tmp/xero-uploads/receipt.jpg'.",
    ),
  },
  async ({ tempPath }) => {
    const resolved = path.resolve(tempPath);
    if (!resolved.startsWith(path.resolve(TEMP_DIR))) {
      return {
        content: [{ type: "text" as const, text: "Error: Path is outside the allowed temp directory." }],
      };
    }
    try {
      fs.unlinkSync(resolved);
      return {
        content: [{ type: "text" as const, text: `Deleted: ${resolved}` }],
      };
    } catch {
      return {
        content: [{ type: "text" as const, text: `File not found or already deleted: ${resolved}` }],
      };
    }
  },
);

export default DeleteTempFileTool;
