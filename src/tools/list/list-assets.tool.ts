import { z } from "zod";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { listXeroAssets, AssetStatusQueryParam } from "../../handlers/list-xero-assets.handler.js";

type AssetOrderBy = "AssetType" | "AssetName" | "AssetNumber" | "PurchaseDate" | "PurchasePrice" | "DisposalDate" | "DisposalPrice";

const ListAssetsTool = CreateXeroTool(
  "list-assets",
  "List fixed assets in Xero. Filter by status: Draft, Registered, or Disposed. \
Use list-asset-types to see available asset type IDs.",
  {
    status: z
      .enum(["Draft", "Registered", "Disposed"])
      .default("Registered")
      .describe("Filter assets by status. Defaults to Registered."),
    page: z.number().default(1),
    pageSize: z.number().default(10).describe("Number of assets per page (max 100)."),
    orderBy: z.enum(["AssetType", "AssetName", "AssetNumber", "PurchaseDate", "PurchasePrice", "DisposalDate", "DisposalPrice"]).optional().describe("Field to order results by."),
    sortDirection: z.enum(["asc", "desc"]).optional(),
    filterBy: z.string().optional().describe("Filter by asset name."),
  },
  async ({ status, page, pageSize, orderBy, sortDirection, filterBy }: { status: string; page: number; pageSize: number; orderBy?: AssetOrderBy; sortDirection?: "asc" | "desc"; filterBy?: string }) => {
    const statusMap: Record<string, AssetStatusQueryParam> = {
      Draft: AssetStatusQueryParam.DRAFT,
      Registered: AssetStatusQueryParam.REGISTERED,
      Disposed: AssetStatusQueryParam.DISPOSED,
    };

    const response = await listXeroAssets(
      statusMap[status],
      page,
      pageSize,
      orderBy,
      sortDirection,
      filterBy,
    );

    if (response.isError) {
      return { content: [{ type: "text" as const, text: `Error listing assets: ${response.error}` }] };
    }

    const assets = response.result;
    return {
      content: [
        { type: "text" as const, text: `Found ${assets?.length ?? 0} assets:` },
        ...(assets?.map((asset) => ({
          type: "text" as const,
          text: [
            `Asset ID: ${asset.assetId}`,
            `Name: ${asset.assetName}`,
            asset.assetNumber ? `Number: ${asset.assetNumber}` : null,
            `Status: ${asset.assetStatus}`,
            asset.assetTypeId ? `Asset Type ID: ${asset.assetTypeId}` : null,
            asset.purchaseDate ? `Purchase Date: ${asset.purchaseDate}` : null,
            asset.purchasePrice !== undefined ? `Purchase Price: ${asset.purchasePrice}` : null,
            asset.accountingBookValue !== undefined ? `Book Value: ${asset.accountingBookValue}` : null,
            asset.serialNumber ? `Serial Number: ${asset.serialNumber}` : null,
            asset.warrantyExpiryDate ? `Warranty Expiry: ${asset.warrantyExpiryDate}` : null,
            asset.disposalDate ? `Disposal Date: ${asset.disposalDate}` : null,
            asset.disposalPrice !== undefined ? `Disposal Price: ${asset.disposalPrice}` : null,
            asset.bookDepreciationSetting?.depreciationMethod
              ? `Depreciation Method: ${asset.bookDepreciationSetting.depreciationMethod}`
              : null,
            asset.bookDepreciationDetail?.depreciationStartDate
              ? `Depreciation Start: ${asset.bookDepreciationDetail.depreciationStartDate}`
              : null,
            asset.bookDepreciationDetail?.currentAccumDepreciationAmount !== undefined
              ? `Accumulated Depreciation: ${asset.bookDepreciationDetail.currentAccumDepreciationAmount}`
              : null,
          ].filter(Boolean).join("\n"),
        })) ?? []),
      ],
    };
  },
);

export default ListAssetsTool;
