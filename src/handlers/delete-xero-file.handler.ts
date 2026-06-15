import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export async function deleteXeroFile(fileId: string): Promise<XeroClientResponse<boolean>> {
  try {
    await xeroClient.authenticate();
    const tenantId = xeroClient.tenantId;
    await xeroClient.filesApi.deleteFile(tenantId, fileId);
    return { result: true, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
