import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { getXeroAssetSettings } from "../../handlers/get-xero-asset-settings.handler.js";

const GetAssetSettingsTool = CreateXeroTool(
  "get-asset-settings",
  "Get the fixed asset settings for the Xero organisation. Returns the asset number prefix, next sequence number, depreciation start date, and default disposal accounts.",
  {},
  async () => {
    const response = await getXeroAssetSettings();
    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error fetching asset settings: ${response.error}` }] };
    }

    const s = response.result;
    return {
      content: [
        {
          type: "text" as const,
          text: [
            "Fixed Asset Settings:",
            s.assetNumberPrefix ? `Asset Number Prefix: ${s.assetNumberPrefix}` : null,
            s.assetNumberSequence ? `Next Asset Number: ${s.assetNumberSequence}` : null,
            s.assetStartDate ? `Depreciation Start Date: ${s.assetStartDate}` : null,
            s.lastDepreciationDate ? `Last Depreciation Date: ${s.lastDepreciationDate}` : null,
            s.defaultGainOnDisposalAccountId ? `Default Gain on Disposal Account ID: ${s.defaultGainOnDisposalAccountId}` : null,
            s.defaultLossOnDisposalAccountId ? `Default Loss on Disposal Account ID: ${s.defaultLossOnDisposalAccountId}` : null,
            s.defaultCapitalGainOnDisposalAccountId ? `Default Capital Gain Account ID: ${s.defaultCapitalGainOnDisposalAccountId}` : null,
            s.optInForTax !== undefined ? `Opt In For Tax: ${s.optInForTax}` : null,
          ].filter(Boolean).join("\n"),
        },
      ],
    };
  },
);

export default GetAssetSettingsTool;
