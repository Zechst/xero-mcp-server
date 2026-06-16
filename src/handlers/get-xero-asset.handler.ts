import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { Asset } from "xero-node/dist/gen/model/assets/asset.js";

export async function getXeroAsset(assetId: string): Promise<XeroClientResponse<Asset>> {
  try {
    await xeroClient.authenticate();
    const response = await xeroClient.assetApi.getAssetById(
      xeroClient.tenantId,
      assetId,
    );
    return { result: response.body, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
