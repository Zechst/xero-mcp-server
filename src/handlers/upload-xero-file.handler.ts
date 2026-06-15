import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { xeroClient } from "../clients/xero-client.js";
import { FileObject } from "xero-node/dist/gen/model/files/fileObject.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

function fetchUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

export async function uploadXeroFile(
  fileName: string,
  mimeType?: string,
  folderId?: string,
  filePath?: string,
  fileUrl?: string,
  contentBase64?: string,
): Promise<XeroClientResponse<FileObject>> {
  try {
    let buffer: Buffer;
    if (fileUrl) {
      buffer = await fetchUrl(fileUrl);
    } else if (filePath) {
      buffer = fs.readFileSync(path.resolve(filePath));
    } else if (contentBase64) {
      buffer = Buffer.from(contentBase64, "base64");
    } else {
      throw new Error("One of fileUrl, filePath, or contentBase64 must be provided.");
    }

    await xeroClient.authenticate();
    const tenantId = xeroClient.tenantId;

    let fileObject: FileObject;
    if (folderId) {
      const response = await xeroClient.filesApi.uploadFileToFolder(
        tenantId, folderId, buffer, fileName, fileName, undefined, mimeType,
      );
      fileObject = response.body;
    } else {
      const response = await xeroClient.filesApi.uploadFile(
        tenantId, buffer, fileName, fileName, undefined, mimeType,
      );
      fileObject = response.body;
    }

    return { result: fileObject, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
