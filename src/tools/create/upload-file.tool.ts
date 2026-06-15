import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { uploadXeroFile } from "../../handlers/upload-xero-file.handler.js";

const UploadFileTool = CreateXeroTool(
  "upload-file",
  "Upload a file to the Xero Files storage (inbox or a specific folder). \
This is separate from upload-attachment — files uploaded here are stored in Xero's file cabinet \
and are not automatically linked to any accounting entity. \
Provide one of: filePath (server-side path, e.g. from /upload-temp), \
fileUrl (a URL the server will fetch), or contentBase64 (for small files <30KB). \
Use list-folders to find folder IDs. Requires the 'files' OAuth scope.",
  {
    fileName: z.string().describe(
      "The file name including extension, e.g. 'receipt.pdf'.",
    ),
    mimeType: z.string().optional().describe(
      "MIME type of the file, e.g. 'application/pdf', 'image/jpeg'. Optional but recommended.",
    ),
    folderId: z.string().optional().describe(
      "ID of the folder to upload into. Omit to upload to the Inbox.",
    ),
    filePath: z.string().optional().describe(
      "Absolute path to the file on the server's filesystem (e.g. a path from /upload-temp).",
    ),
    fileUrl: z.string().optional().describe(
      "A URL the server will fetch the file from (e.g. a presigned S3 URL).",
    ),
    contentBase64: z.string().optional().describe(
      "File content encoded as a base64 string. Use for small files only (<30KB).",
    ),
  },
  async ({ fileName, mimeType, folderId, filePath, fileUrl, contentBase64 }) => {
    const response = await uploadXeroFile(fileName, mimeType, folderId, filePath, fileUrl, contentBase64);
    if (response.isError) {
      return {
        content: [{ type: "text" as const, text: `Error uploading file: ${response.error}` }],
      };
    }

    const f = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [
            "File uploaded successfully:",
            `Name: ${f.name}`,
            `ID: ${f.id}`,
            f.mimeType ? `MIME: ${f.mimeType}` : null,
            f.size != null ? `Size: ${f.size} bytes` : null,
            f.folderId ? `Folder ID: ${f.folderId}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    };
  },
);

export default UploadFileTool;
