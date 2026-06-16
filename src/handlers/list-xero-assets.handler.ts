import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { Asset } from "xero-node/dist/gen/model/assets/asset.js";
import { AssetStatusQueryParam } from "xero-node/dist/gen/model/assets/assetStatusQueryParam.js";

export { AssetStatusQueryParam };

type AssetOrderBy = "AssetType" | "AssetName" | "AssetNumber" | "PurchaseDate" | "PurchasePrice" | "DisposalDate" | "DisposalPrice";

export async function listXeroAssets(
  status: AssetStatusQueryParam,
  page: number = 1,
  pageSize: number = 10,
  orderBy?: AssetOrderBy,
  sortDirection?: "asc" | "desc",
  filterBy?: string,
): Promise<XeroClientResponse<Asset[]>> {
  try {
    await xeroClient.authenticate();
    const response = await xeroClient.assetApi.getAssets(
      xeroClient.tenantId,
      status,
      page,
      pageSize,
      orderBy,
      sortDirection,
      filterBy,
    );
    return { result: response.body.items ?? [], isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
