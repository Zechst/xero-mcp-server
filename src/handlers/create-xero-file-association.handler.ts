import { xeroClient } from "../clients/xero-client.js";
import { Association } from "xero-node/dist/gen/model/files/association.js";
import { ObjectType } from "xero-node/dist/gen/model/files/objectType.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export { ObjectType };

export async function createXeroFileAssociation(
  fileId: string,
  objectId: string,
  objectType: ObjectType,
  sendWithObject?: boolean,
): Promise<XeroClientResponse<Association>> {
  try {
    await xeroClient.authenticate();
    const tenantId = xeroClient.tenantId;

    const association: Association = { fileId, objectId, objectType, sendWithObject };
    const response = await xeroClient.filesApi.createFileAssociation(tenantId, fileId, association);

    return { result: response.body, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
