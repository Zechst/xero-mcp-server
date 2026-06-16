import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { listXeroAssetTypes } from "../../handlers/list-xero-asset-types.handler.js";

const ListAssetTypesTool = CreateXeroTool(
  "list-asset-types",
  "List all fixed asset types defined in Xero. Returns asset type IDs, names, and linked account IDs needed to create assets or new asset types.",
  {},
  async () => {
    const response = await listXeroAssetTypes();
    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error listing asset types: ${response.error}` }] };
    }

    const types = response.result;
    return {
      content: [
        { type: "text" as const, text: `Found ${types?.length ?? 0} asset types:` },
        ...(types?.map((t) => ({
          type: "text" as const,
          text: [
            `Asset Type ID: ${t.assetTypeId}`,
            `Name: ${t.assetTypeName}`,
            t.fixedAssetAccountId ? `Fixed Asset Account ID: ${t.fixedAssetAccountId}` : null,
            t.depreciationExpenseAccountId ? `Depreciation Expense Account ID: ${t.depreciationExpenseAccountId}` : null,
            t.accumulatedDepreciationAccountId ? `Accumulated Depreciation Account ID: ${t.accumulatedDepreciationAccountId}` : null,
            t.bookDepreciationSetting?.depreciationMethod !== undefined
              ? `Depreciation Method: ${t.bookDepreciationSetting.depreciationMethod}`
              : null,
            t.bookDepreciationSetting?.depreciationRate !== undefined
              ? `Depreciation Rate: ${t.bookDepreciationSetting.depreciationRate}`
              : null,
            t.bookDepreciationSetting?.effectiveLifeYears !== undefined
              ? `Effective Life (years): ${t.bookDepreciationSetting.effectiveLifeYears}`
              : null,
            t.locks !== undefined ? `Locks: ${t.locks}` : null,
          ].filter(Boolean).join("\n"),
        })) ?? []),
      ],
    };
  },
);

export default ListAssetTypesTool;
