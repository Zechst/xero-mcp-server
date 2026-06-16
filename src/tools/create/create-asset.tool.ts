import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { createXeroAsset, BookDepreciationSetting } from "../../handlers/create-xero-asset.handler.js";

const CreateAssetTool = CreateXeroTool(
  "create-asset",
  "Create a new fixed asset in Xero (status: Draft). Use list-asset-types to get assetTypeId and \
list-accounts to get account IDs. To register an asset, it must be done in the Xero UI after creation.",
  {
    assetName: z.string().describe("The name of the fixed asset. Must be unique."),
    assetTypeId: z.string().optional().describe("The UUID of the asset type. Use list-asset-types to find it."),
    assetNumber: z.string().optional().describe("A unique identifier for the asset (auto-generated if omitted)."),
    purchaseDate: z.string().optional().describe("Date the asset was purchased, YYYY-MM-DD."),
    purchasePrice: z.number().optional().describe("The purchase price of the asset."),
    warrantyExpiryDate: z.string().optional().describe("Date the warranty expires, YYYY-MM-DD."),
    serialNumber: z.string().optional().describe("The asset's serial number."),
    depreciationMethod: z
      .enum(["NoDepreciation", "StraightLine", "DiminishingValue100", "DiminishingValue150", "DiminishingValue200", "FullDepreciation"])
      .optional()
      .describe("Depreciation method."),
    averagingMethod: z
      .enum(["FullMonth", "ActualDays"])
      .optional()
      .describe("Averaging method for depreciation."),
    depreciationRate: z.number().optional().describe("Rate of depreciation (e.g. 0.25 for 25%)."),
    effectiveLifeYears: z.number().optional().describe("Effective life of the asset in years."),
    depreciationStartDate: z.string().optional().describe("Date depreciation starts, YYYY-MM-DD."),
    residualValue: z.number().optional().describe("The value remaining when fully depreciated."),
    costLimit: z.number().optional().describe("The value you want to depreciate (if less than purchase price)."),
  },
  async ({
    assetName,
    assetTypeId,
    assetNumber,
    purchaseDate,
    purchasePrice,
    warrantyExpiryDate,
    serialNumber,
    depreciationMethod,
    averagingMethod,
    depreciationRate,
    effectiveLifeYears,
    depreciationStartDate,
    residualValue,
    costLimit,
  }) => {
    const methodMap: Record<string, BookDepreciationSetting.DepreciationMethodEnum> = {
      NoDepreciation: BookDepreciationSetting.DepreciationMethodEnum.NoDepreciation,
      StraightLine: BookDepreciationSetting.DepreciationMethodEnum.StraightLine,
      DiminishingValue100: BookDepreciationSetting.DepreciationMethodEnum.DiminishingValue100,
      DiminishingValue150: BookDepreciationSetting.DepreciationMethodEnum.DiminishingValue150,
      DiminishingValue200: BookDepreciationSetting.DepreciationMethodEnum.DiminishingValue200,
      FullDepreciation: BookDepreciationSetting.DepreciationMethodEnum.FullDepreciation,
    };
    const avgMap: Record<string, BookDepreciationSetting.AveragingMethodEnum> = {
      FullMonth: BookDepreciationSetting.AveragingMethodEnum.FullMonth,
      ActualDays: BookDepreciationSetting.AveragingMethodEnum.ActualDays,
    };

    const bookDepreciationSetting: BookDepreciationSetting | undefined =
      depreciationMethod || averagingMethod || depreciationRate !== undefined || effectiveLifeYears !== undefined
        ? {
            depreciationMethod: depreciationMethod ? methodMap[depreciationMethod] : undefined,
            averagingMethod: averagingMethod ? avgMap[averagingMethod] : undefined,
            depreciationRate,
            effectiveLifeYears,
          }
        : undefined;

    const response = await createXeroAsset(
      assetName,
      assetTypeId,
      assetNumber,
      purchaseDate,
      purchasePrice,
      warrantyExpiryDate,
      serialNumber,
      bookDepreciationSetting,
      depreciationStartDate,
      residualValue,
      costLimit,
    );

    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error creating asset: ${response.error}` }] };
    }

    const a = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [
            "Fixed asset created successfully (status: Draft):",
            `Asset ID: ${a.assetId}`,
            `Name: ${a.assetName}`,
            a.assetNumber ? `Number: ${a.assetNumber}` : null,
            a.assetTypeId ? `Asset Type ID: ${a.assetTypeId}` : null,
            a.purchaseDate ? `Purchase Date: ${a.purchaseDate}` : null,
            a.purchasePrice !== undefined ? `Purchase Price: ${a.purchasePrice}` : null,
          ].filter(Boolean).join("\n"),
        },
      ],
    };
  },
);

export default CreateAssetTool;
