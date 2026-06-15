import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import FormData from "form-data";
import axios from "axios";
import { xeroClient } from "../clients/xero-client.js";
import { FileObject } from "xero-node/dist/gen/model/files/fileObject.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

const FILES_API = "https://api.xero.com/files.xro/1.0";

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
    if (filePath) {
      buffer = fs.readFileSync(path.resolve(filePath));
    } else if (fileUrl) {
      buffer = await fetchUrl(fileUrl);
    } else if (contentBase64) {
      buffer = Buffer.from(contentBase64, "base64");
    } else {
      throw new Error("One of fileUrl, filePath, or contentBase64 must be provided.");
    }

    await xeroClient.authenticate();
    const tenantId = xeroClient.tenantId;
    const tokenSet = xeroClient.readTokenSet();
    const accessToken = tokenSet.access_token;

    // xero-node's filesApi.uploadFile is broken — it passes a plain object to axios
    // instead of a FormData instance. Post directly to avoid the SDK bug.
    // Xero validates file extension from the form field *name*, not the filename metadata.
    const form = new FormData();
    form.append(fileName, buffer, {
      filename: fileName,
      contentType: mimeType ?? "application/octet-stream",
    });
    form.append("name", fileName);
    form.append("filename", fileName);
    if (mimeType) form.append("mimeType", mimeType);

    const endpoint = folderId
      ? `${FILES_API}/Files/${encodeURIComponent(folderId)}`
      : `${FILES_API}/Files`;

    const response = await axios.post<Record<string, unknown>>(endpoint, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${accessToken}`,
        "xero-tenant-id": tenantId,
        Accept: "application/json",
      },
    });

    // Xero Files API returns PascalCase keys; normalise to camelCase for FileObject
    const raw = response.data;
    const fileObject: FileObject = {
      id: (raw.Id ?? raw.id) as string | undefined,
      name: (raw.Name ?? raw.name) as string | undefined,
      mimeType: (raw.MimeType ?? raw.mimeType) as string | undefined,
      size: (raw.Size ?? raw.size) as number | undefined,
      folderId: (raw.FolderId ?? raw.folderId) as string | undefined,
      createdDateUtc: (raw.CreatedDateUtc ?? raw.createdDateUtc) as string | undefined,
      updatedDateUtc: (raw.UpdatedDateUtc ?? raw.updatedDateUtc) as string | undefined,
    };

    return { result: fileObject, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
