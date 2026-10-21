import { buildUserDataExport, runErasureExportFlow } from "../../src/services/gdprErasureExport";

describe("GDPR erasure export flow", () => {
  it("builds a portable snapshot before creating a deletion request", async () => {
    const createRequest = jest.fn(async ({ userId, reason }) => ({
      id: "req-1",
      userId,
      reason,
      status: "pending",
    }));

    const result = await runErasureExportFlow({
      userId: "GWALLET",
      account: { walletAddress: "GWALLET" },
      preferences: { emailEnabled: true },
      reason: "leaving",
      existingPending: null,
      createRequest,
    });

    expect(createRequest).toHaveBeenCalledTimes(1);
    expect(result.alreadyPending).toBe(false);
    expect(result.dataExport.userId).toBe("GWALLET");
    expect(result.dataExport.account).toEqual({ walletAddress: "GWALLET" });
    expect(result.deletionRequest).toMatchObject({ id: "req-1", status: "pending" });
  });

  it("does not create a deletion request when export construction fails", async () => {
    const createRequest = jest.fn();
    await expect(
      runErasureExportFlow({
        userId: "",
        existingPending: null,
        createRequest,
      }),
    ).rejects.toThrow("userId is required");
    expect(createRequest).not.toHaveBeenCalled();
  });

  it("returns a fresh export for an already-pending request without inserting again", async () => {
    const existing = { id: "req-9", status: "pending" };
    const createRequest = jest.fn();
    const result = await runErasureExportFlow({
      userId: "GWALLET",
      existingPending: existing,
      createRequest,
    });
    expect(createRequest).not.toHaveBeenCalled();
    expect(result.alreadyPending).toBe(true);
    expect(result.deletionRequest).toBe(existing);
    expect(buildUserDataExport({ userId: "GWALLET" }).omitted.bookings).toContain("not linked");
  });
});
