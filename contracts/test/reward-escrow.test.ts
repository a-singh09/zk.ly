import { describe, expect, it } from "vitest";
import * as runtime from "@midnight-ntwrk/compact-runtime";

import { bytes32FromText, bytesFromTextFixed, ZERO_32 } from "./utils.js";

import * as RewardEscrow from "../contracts/managed/reward-escrow/contract/index.js";

function makeContext(params: {
  contractState: runtime.ContractState;
  privateState: unknown;
  coinPublicKey: Uint8Array;
}) {
  return runtime.createCircuitContext(
    runtime.dummyContractAddress(),
    params.coinPublicKey,
    params.contractState.data,
    params.privateState,
  );
}

describe("reward-escrow circuits", () => {
  it("configure_quest_escrow + approve_reward reserves budget and writes reservation", () => {
    const adminSk = bytes32FromText("admin-secret");
    const contract = new RewardEscrow.Contract({
      get_admin_secret_key: () => [undefined, adminSk],
      get_user_secret_key: () => [undefined, bytes32FromText("user-secret")],
    });

    const initial = contract.initialState({
      initialPrivateState: {},
      initialZswapLocalState: { coinPublicKey: ZERO_32.slice() },
    });

    const ctx = makeContext({
      contractState: initial.currentContractState,
      privateState: initial.currentPrivateState,
      coinPublicKey: ZERO_32.slice(),
    });

    const questId = bytes32FromText("quest-1");
    const assetContract = bytes32FromText("asset-1");

    const configured = contract.circuits.configure_quest_escrow(
      ctx,
      questId,
      assetContract,
      100n,
      10n,
    );

    const ledgerAfterCfg = RewardEscrow.ledger(
      configured.context.currentQueryContext.state,
    );
    expect(ledgerAfterCfg.escrows.size()).toBe(1n);
    const escrow = ledgerAfterCfg.escrows.lookup(questId);
    expect(escrow.total_budget).toBe(100n);
    expect(escrow.default_reward_amount).toBe(10n);

    const adminKey = contract._derive_actor_key_0(
      bytesFromTextFixed("zkquest:creator:", 32),
      adminSk,
    );

    const certId = bytes32FromText("cert-1");
    const completerKey = bytes32FromText("completer-key");

    const approved = contract.circuits.approve_reward(
      configured.context,
      certId,
      questId,
      completerKey,
      25n,
      1234n,
    );

    const ledgerAfterApprove = RewardEscrow.ledger(
      approved.context.currentQueryContext.state,
    );
    const escrow2 = ledgerAfterApprove.escrows.lookup(questId);
    expect(escrow2.admin_key).toEqual(adminKey);
    expect(escrow2.reserved_budget).toBe(25n);
    expect(ledgerAfterApprove.reservations.size()).toBe(1n);
    const reservation = ledgerAfterApprove.reservations.lookup(certId);
    expect(reservation.status).toBe(RewardEscrow.RewardReservationStatus.RESERVED);
    expect(reservation.amount).toBe(25n);
  });

  it("approve_reward fails when budget would be exhausted", () => {
    const adminSk = bytes32FromText("admin-secret");
    const contract = new RewardEscrow.Contract({
      get_admin_secret_key: () => [undefined, adminSk],
      get_user_secret_key: () => [undefined, bytes32FromText("user-secret")],
    });

    const initial = contract.initialState({
      initialPrivateState: {},
      initialZswapLocalState: { coinPublicKey: ZERO_32.slice() },
    });

    const ctx = makeContext({
      contractState: initial.currentContractState,
      privateState: initial.currentPrivateState,
      coinPublicKey: ZERO_32.slice(),
    });

    const questId = bytes32FromText("quest-1");
    const configured = contract.circuits.configure_quest_escrow(
      ctx,
      questId,
      bytes32FromText("asset-1"),
      10n,
      1n,
    );

    expect(() =>
      contract.circuits.approve_reward(
        configured.context,
        bytes32FromText("cert-1"),
        questId,
        bytes32FromText("completer"),
        11n,
        1n,
      ),
    ).toThrow(/budget exhausted/i);
  });
});

