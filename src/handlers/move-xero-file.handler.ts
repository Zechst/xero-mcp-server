import { xeroClient } from "../clients/xero-client.js";
import { FileObject } from "xero-node/dist/gen/model/files/fileObject.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export async function moveXeroFile(
  fileId: string,
  folderId: string,
): Promise<XeroClientResponse<FileObject>> {
  try {
    await xeroClient.authenticate();
    const tenantId = xeroClient.tenantId;
    const response = await xeroClient.filesApi.updateFile(tenantId, fileId, { folderId });
    return { result: response.body, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
