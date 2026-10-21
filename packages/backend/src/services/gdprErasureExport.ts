/**
 * GDPR erasure export flow (issue #698).
 *
 * Art. 20 (portability) runs before Art. 17 (erasure): a deletion request
 * always returns a data-export snapshot so the subject can keep a copy
 * during the 30-day verification window. If export construction fails,
 * no deletion request is created.
 */

export const OMITTED_UNLINKED_RECORDS = {
  bookings: 'not linked to a wallet-based user identity in the current schema',
  passengers: 'not linked to a wallet-based user identity in the current schema',
} as const;

export interface UserDataExport {
  exportedAt: string;
  userId: string;
  account: unknown;
  preferences: unknown;
  omitted: typeof OMITTED_UNLINKED_RECORDS;
}

export function buildUserDataExport(input: {
  userId: string;
  account?: unknown;
  preferences?: unknown;
  at?: Date;
}): UserDataExport {
  if (!input.userId || typeof input.userId !== 'string') {
    throw new Error('userId is required to build a GDPR export');
  }
  return {
    exportedAt: (input.at ?? new Date()).toISOString(),
    userId: input.userId,
    account: input.account ?? null,
    preferences: input.preferences ?? null,
    omitted: OMITTED_UNLINKED_RECORDS,
  };
}

export async function runErasureExportFlow<TRequest>(input: {
  userId: string;
  account?: unknown;
  preferences?: unknown;
  reason?: string | null;
  existingPending: TRequest | null;
  createRequest: (payload: { userId: string; reason: string | null }) => Promise<TRequest>;
}): Promise<{
  alreadyPending: boolean;
  deletionRequest: TRequest;
  dataExport: UserDataExport;
}> {
  const dataExport = buildUserDataExport({
    userId: input.userId,
    account: input.account,
    preferences: input.preferences,
  });

  if (input.existingPending) {
    return {
      alreadyPending: true,
      deletionRequest: input.existingPending,
      dataExport,
    };
  }

  const deletionRequest = await input.createRequest({
    userId: input.userId,
    reason: input.reason ?? null,
  });

  return {
    alreadyPending: false,
    deletionRequest,
    dataExport,
  };
}
