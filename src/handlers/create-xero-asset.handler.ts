import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { Asset } from "xero-node/dist/gen/model/assets/asset.js";
import { AssetStatus } from "xero-node/dist/gen/model/assets/assetStatus.js";
import { BookDepreciationSetting } from "xero-node/dist/gen/model/assets/bookDepreciationSetting.js";

export { AssetStatus, BookDepreciationSetting };

export async function createXeroAsset(
  assetName: string,
  assetTypeId?: string,
  assetNumber?: string,
  purchaseDate?: string,
  purchasePrice?: number,
  warrantyExpiryDate?: string,
  serialNumber?: string,
  bookDepreciationSetting?: BookDepreciationSetting,
  depreciationStartDate?: string,
  residualValue?: number,
  costLimit?: number,
): Promise<XeroClientResponse<Asset>> {
  try {
    await xeroClient.authenticate();

    const asset: Asset = {
      assetName,
      assetTypeId,
      assetNumber,
      purchaseDate,
      purchasePrice,
      warrantyExpiryDate,
      serialNumber,
      assetStatus: AssetStatus.Draft,
      bookDepreciationSetting,
      bookDepreciationDetail: depreciationStartDate || residualValue !== undefined || costLimit !== undefined
        ? { depreciationStartDate, residualValue, costLimit }
        : undefined,
    };

    const response = await xeroClient.assetApi.createAsset(
      xeroClient.tenantId,
      asset,
    );
    return { result: response.body, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
