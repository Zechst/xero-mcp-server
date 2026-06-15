import { xeroClient } from "../clients/xero-client.js";
import { Association } from "xero-node/dist/gen/model/files/association.js";
import { ObjectType } from "xero-node/dist/gen/model/files/objectType.js";
import { ObjectGroup } from "xero-node/dist/gen/model/files/objectGroup.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export { ObjectType };

const OBJECT_GROUP_MAP: Partial<Record<ObjectType, ObjectGroup>> = {
  [ObjectType.Accpay]:        ObjectGroup.Invoice,
  [ObjectType.AccPayCredit]:  ObjectGroup.CreditNote,
  [ObjectType.AccPayPayment]: ObjectGroup.Payment,
  [ObjectType.AccRec]:        ObjectGroup.Invoice,
  [ObjectType.AccRecCredit]:  ObjectGroup.CreditNote,
  [ObjectType.AccRecPayment]: ObjectGroup.Payment,
  [ObjectType.ManJournal]:    ObjectGroup.ManualJournal,
  [ObjectType.PurchaseOrder]: ObjectGroup.Invoice,
  [ObjectType.SalesQuote]:    ObjectGroup.Quote,
  [ObjectType.Receipt]:       ObjectGroup.Receipt,
  [ObjectType.CashPaid]:      ObjectGroup.BankTransaction,
  [ObjectType.CashRec]:       ObjectGroup.BankTransaction,
  [ObjectType.Contact]:       ObjectGroup.Contact,
};

export async function createXeroFileAssociation(
  fileId: string,
  objectId: string,
  objectType: ObjectType,
  sendWithObject?: boolean,
): Promise<XeroClientResponse<Association>> {
  try {
    await xeroClient.authenticate();
    const tenantId = xeroClient.tenantId;

    const objectGroup = OBJECT_GROUP_MAP[objectType];
    const association: Association = { fileId, objectId, objectType, objectGroup, sendWithObject };
    const response = await xeroClient.filesApi.createFileAssociation(tenantId, fileId, association);

    return { result: response.body, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
