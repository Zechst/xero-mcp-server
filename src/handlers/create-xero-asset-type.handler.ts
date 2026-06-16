import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { AssetType } from "xero-node/dist/gen/model/assets/assetType.js";
import { BookDepreciationSetting } from "xero-node/dist/gen/model/assets/bookDepreciationSetting.js";

export async function createXeroAssetType(
  assetTypeName: string,
  fixedAssetAccountId: string,
  depreciationExpenseAccountId: string,
  accumulatedDepreciationAccountId: string,
  bookDepreciationSetting: BookDepreciationSetting,
): Promise<XeroClientResponse<AssetType>> {
  try {
    await xeroClient.authenticate();

    const assetType: AssetType = {
      assetTypeName,
      fixedAssetAccountId,
      depreciationExpenseAccountId,
      accumulatedDepreciationAccountId,
      bookDepreciationSetting,
    };

    const response = await xeroClient.assetApi.createAssetType(
      xeroClient.tenantId,
      assetType,
    );
    return { result: response.body, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
