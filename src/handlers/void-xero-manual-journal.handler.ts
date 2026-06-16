import { ManualJournal, ManualJournals } from "xero-node";
import { xeroClient } from "../clients/xero-client.js";
import { getClientHeaders } from "../helpers/get-client-headers.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export async function voidXeroManualJournal(
  manualJournalID: string,
): Promise<XeroClientResponse<ManualJournal>> {
  try {
    await xeroClient.authenticate();

    const getResponse = await xeroClient.accountingApi.getManualJournal(
      xeroClient.tenantId,
      manualJournalID,
      getClientHeaders(),
    );

    const existing = getResponse.body.manualJournals?.[0];
    if (!existing) {
      throw new Error("Manual journal not found.");
    }

    if (existing.status !== ManualJournal.StatusEnum.POSTED) {
      throw new Error(
        `Only POSTED manual journals can be voided. Current status: ${existing.status}`,
      );
    }

    const payload: ManualJournals = {
      manualJournals: [
        {
          narration: existing.narration!,
          journalLines: existing.journalLines,
          status: ManualJournal.StatusEnum.VOIDED,
        },
      ],
    };

    const response = await xeroClient.accountingApi.updateManualJournal(
      xeroClient.tenantId,
      manualJournalID,
      payload,
      undefined,
      getClientHeaders(),
    );

    const result = response.body.manualJournals?.[0];
    if (!result) {
      throw new Error("Void failed.");
    }

    return { result, isError: false, error: null };
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
