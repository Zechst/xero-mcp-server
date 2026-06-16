import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { getXeroAsset } from "../../handlers/get-xero-asset.handler.js";

const GetAssetTool = CreateXeroTool(
  "get-asset",
  "Fetch a single fixed asset by its UUID. Returns full details including depreciation settings and current book value.",
  {
    assetId: z.string().describe("The UUID of the fixed asset (assetId from list-assets)."),
  },
  async ({ assetId }) => {
    const response = await getXeroAsset(assetId);
    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error fetching asset: ${response.error}` }] };
    }

    const a = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [
            `Asset ID: ${a.assetId}`,
            `Name: ${a.assetName}`,
            a.assetNumber ? `Number: ${a.assetNumber}` : null,
            `Status: ${a.assetStatus}`,
            a.assetTypeId ? `Asset Type ID: ${a.assetTypeId}` : null,
            a.purchaseDate ? `Purchase Date: ${a.purchaseDate}` : null,
            a.purchasePrice !== undefined ? `Purchase Price: ${a.purchasePrice}` : null,
            a.accountingBookValue !== undefined ? `Book Value: ${a.accountingBookValue}` : null,
            a.serialNumber ? `Serial Number: ${a.serialNumber}` : null,
            a.warrantyExpiryDate ? `Warranty Expiry: ${a.warrantyExpiryDate}` : null,
            a.disposalDate ? `Disposal Date: ${a.disposalDate}` : null,
            a.disposalPrice !== undefined ? `Disposal Price: ${a.disposalPrice}` : null,
            a.canRollback !== undefined ? `Can Rollback: ${a.canRollback}` : null,
            a.isDeleteEnabledForDate !== undefined ? `Delete Enabled: ${a.isDeleteEnabledForDate}` : null,
            a.bookDepreciationSetting
              ? [
                  "\nDepreciation Setting:",
                  `  Method: ${a.bookDepreciationSetting.depreciationMethod ?? "(none)"}`,
                  `  Averaging: ${a.bookDepreciationSetting.averagingMethod ?? "(none)"}`,
                  a.bookDepreciationSetting.depreciationRate !== undefined
                    ? `  Rate: ${a.bookDepreciationSetting.depreciationRate}`
                    : null,
                  a.bookDepreciationSetting.effectiveLifeYears !== undefined
                    ? `  Effective Life (years): ${a.bookDepreciationSetting.effectiveLifeYears}`
                    : null,
                ].filter(Boolean).join("\n")
              : null,
            a.bookDepreciationDetail
              ? [
                  "\nDepreciation Detail:",
                  a.bookDepreciationDetail.depreciationStartDate
                    ? `  Start Date: ${a.bookDepreciationDetail.depreciationStartDate}`
                    : null,
                  a.bookDepreciationDetail.costLimit !== undefined
                    ? `  Cost Limit: ${a.bookDepreciationDetail.costLimit}`
                    : null,
                  a.bookDepreciationDetail.residualValue !== undefined
                    ? `  Residual Value: ${a.bookDepreciationDetail.residualValue}`
                    : null,
                  a.bookDepreciationDetail.priorAccumDepreciationAmount !== undefined
                    ? `  Prior Accum Depreciation: ${a.bookDepreciationDetail.priorAccumDepreciationAmount}`
                    : null,
                  a.bookDepreciationDetail.currentAccumDepreciationAmount !== undefined
                    ? `  Current Accum Depreciation: ${a.bookDepreciationDetail.currentAccumDepreciationAmount}`
                    : null,
                ].filter(Boolean).join("\n")
              : null,
          ].filter(Boolean).join("\n"),
        },
      ],
    };
  },
);

export default GetAssetTool;
