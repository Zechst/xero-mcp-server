import { xeroClient } from "../clients/xero-client.js";
import { Folder } from "xero-node/dist/gen/model/files/folder.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export async function createXeroFolder(name: string): Promise<XeroClientResponse<Folder>> {
  try {
    await xeroClient.authenticate();
    const tenantId = xeroClient.tenantId;
    const response = await xeroClient.filesApi.createFolder(tenantId, { name });
    return { result: response.body, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
