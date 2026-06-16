import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { createXeroAssetType } from "../../handlers/create-xero-asset-type.handler.js";
import { BookDepreciationSetting } from "xero-node/dist/gen/model/assets/bookDepreciationSetting.js";

const CreateAssetTypeTool = CreateXeroTool(
  "create-asset-type",
  "Create a new fixed asset type in Xero. Asset types define the GL accounts and default depreciation \
settings applied to assets of that type. Use list-accounts to find account IDs.",
  {
    assetTypeName: z.string().describe("The name of the asset type (e.g. 'Office Equipment')."),
    fixedAssetAccountId: z.string().describe("UUID of the fixed asset account. Use list-accounts to find it."),
    depreciationExpenseAccountId: z.string().describe("UUID of the depreciation expense account."),
    accumulatedDepreciationAccountId: z.string().describe("UUID of the accumulated depreciation account."),
    depreciationMethod: z
      .enum(["NoDepreciation", "StraightLine", "DiminishingValue100", "DiminishingValue150", "DiminishingValue200", "FullDepreciation"])
      .describe("Depreciation method for this asset type."),
    averagingMethod: z
      .enum(["FullMonth", "ActualDays"])
      .optional()
      .describe("Averaging method for depreciation calculations."),
    depreciationRate: z.number().optional().describe("Rate of depreciation (e.g. 0.25 for 25%). Use with StraightLine or DiminishingValue methods."),
    effectiveLifeYears: z.number().optional().describe("Effective life in years. Alternative to depreciationRate for StraightLine."),
  },
  async ({
    assetTypeName,
    fixedAssetAccountId,
    depreciationExpenseAccountId,
    accumulatedDepreciationAccountId,
    depreciationMethod,
    averagingMethod,
    depreciationRate,
    effectiveLifeYears,
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

    const bookDepreciationSetting: BookDepreciationSetting = {
      depreciationMethod: methodMap[depreciationMethod],
      averagingMethod: averagingMethod ? avgMap[averagingMethod] : undefined,
      depreciationRate,
      effectiveLifeYears,
    };

    const response = await createXeroAssetType(
      assetTypeName,
      fixedAssetAccountId,
      depreciationExpenseAccountId,
      accumulatedDepreciationAccountId,
      bookDepreciationSetting,
    );

    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error creating asset type: ${response.error}` }] };
    }

    const t = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [
            "Asset type created successfully:",
            `Asset Type ID: ${t.assetTypeId}`,
            `Name: ${t.assetTypeName}`,
            `Fixed Asset Account ID: ${t.fixedAssetAccountId}`,
            `Depreciation Expense Account ID: ${t.depreciationExpenseAccountId}`,
            `Accumulated Depreciation Account ID: ${t.accumulatedDepreciationAccountId}`,
            `Depreciation Method: ${t.bookDepreciationSetting?.depreciationMethod}`,
          ].filter(Boolean).join("\n"),
        },
      ],
    };
  },
);

export default CreateAssetTypeTool;
