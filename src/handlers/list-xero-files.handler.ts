import { xeroClient } from "../clients/xero-client.js";
import { FileObject } from "xero-node/dist/gen/model/files/fileObject.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export interface XeroFilesResult {
  totalCount?: number;
  page?: number;
  perPage?: number;
  items: FileObject[];
}

export async function listXeroFiles(
  pageSize?: number,
  page?: number,
  sort?: "Name" | "Size" | "CreatedDateUTC",
): Promise<XeroClientResponse<XeroFilesResult>> {
  try {
    await xeroClient.authenticate();
    const tenantId = xeroClient.tenantId;
    const response = await xeroClient.filesApi.getFiles(tenantId, pageSize, page, sort);
    return {
      result: {
        totalCount: response.body.totalCount,
        page: response.body.page,
        perPage: response.body.perPage,
        items: response.body.items ?? [],
      },
      isError: false,
      error: null,
    };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
