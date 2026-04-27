import { describe, expect, it } from "vitest";
import * as runtime from "@midnight-ntwrk/compact-runtime";

import {
  bytes32FromText,
  bytesFromTextFixed,
  ZERO_8,
  ZERO_32,
  ZERO_256,
} from "./utils.js";

import * as CompletionRegistry from "../contracts/managed/completion-registry/contract/index.js";

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

function fixed8(text: string) {
  return bytesFromTextFixed(text, 8);
}

describe("completion-registry circuits", () => {
  it("verify_completion inserts a PENDING_ADMIN certificate", () => {
    const criteriaBytes = bytesFromTextFixed(`{"minScore":70}`, 256);
    const reviewPayload = bytesFromTextFixed(`{"score":88}`, 256);
    const commitmentPayload = bytesFromTextFixed(`{"reviewId":"r1"}`, 256);

    const userSk = bytes32FromText("user-secret");
    const adminSk = bytes32FromText("admin-secret");

    const contract = new CompletionRegistry.Contract({
      get_user_secret_key: () => [undefined, userSk],
      get_admin_secret_key: () => [undefined, adminSk],
      get_evidence_hash: () => [undefined, bytes32FromText("evidence-hash")],
      get_evidence_class_raw: () => [undefined, fixed8("AI_SCORE")],
      get_verification_score: () => [undefined, 88n],
      get_criteria_bytes: () => [undefined, criteriaBytes],
      get_req_evidence_class: () => [undefined, fixed8("AI_SCORE")],
      get_min_score_threshold: () => [undefined, 70n],
      get_freq_slots_required: () => [undefined, 0n],
      get_last_completion_slot: () => [undefined, 0n],
      get_current_slot: () => [undefined, 1234n],
      get_review_payload: () => [undefined, reviewPayload],
      get_commitment_payload: () => [undefined, commitmentPayload],
      get_passed_flag: () => [undefined, true],
      get_score_band: () => [undefined, 3n],
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

    // Compute the on-chain criteria commitment exactly as the circuit does.
    const onChainCommitment = contract._persistentHash_0(criteriaBytes);

    const adminKey = contract._derive_actor_key_0(
      bytesFromTextFixed("zkquest:creator:", 32),
      adminSk,
    );

    const call = contract.circuits.verify_completion(
      ctx,
      bytes32FromText("quest-1"),
      bytes32FromText("sprint-1"),
      bytes32FromText("space-1"),
      adminKey,
      onChainCommitment,
      100n,
    );

    const ledgerState = CompletionRegistry.ledger(
      call.context.currentQueryContext.state,
    );
    expect(ledgerState.completions.size()).toBe(1n);

    const [certId, cert] = Array.from(ledgerState.completions)[0]!;
    expect(certId).toBeInstanceOf(Uint8Array);
    expect(cert.status).toBe(CompletionRegistry.CompletionStatus.PENDING_ADMIN);
    expect(cert.xp_awarded).toBe(100n);
    expect(cert.passed_flag).toBe(true);
    expect(cert.score_band).toBe(3n);
    expect(cert.review_commitment).toBeInstanceOf(Uint8Array);
    expect(cert.commitment_commitment).toBeInstanceOf(Uint8Array);
  });

  it("verify_completion fails if on_chain_commitment does not match criteria_bytes witness", () => {
    const contract = new CompletionRegistry.Contract({
      get_user_secret_key: () => [undefined, bytes32FromText("user-secret")],
      get_admin_secret_key: () => [undefined, bytes32FromText("admin-secret")],
      get_evidence_hash: () => [undefined, bytes32FromText("evidence-hash")],
      get_evidence_class_raw: () => [undefined, fixed8("AI_SCORE")],
      get_verification_score: () => [undefined, 88n],
      get_criteria_bytes: () => [undefined, bytesFromTextFixed("criteria-A", 256)],
      get_req_evidence_class: () => [undefined, fixed8("AI_SCORE")],
      get_min_score_threshold: () => [undefined, 70n],
      get_freq_slots_required: () => [undefined, 0n],
      get_last_completion_slot: () => [undefined, 0n],
      get_current_slot: () => [undefined, 1234n],
      get_review_payload: () => [undefined, ZERO_256.slice()],
      get_commitment_payload: () => [undefined, ZERO_256.slice()],
      get_passed_flag: () => [undefined, true],
      get_score_band: () => [undefined, 3n],
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

    // Commitment for different criteria bytes.
    const wrongCommitment = contract._persistentHash_0(
      bytesFromTextFixed("criteria-B", 256),
    );

    expect(() =>
      contract.circuits.verify_completion(
        ctx,
        bytes32FromText("quest-1"),
        bytes32FromText("sprint-1"),
        bytes32FromText("space-1"),
        ZERO_32.slice(),
        wrongCommitment,
        100n,
      ),
    ).toThrow(/Criteria mismatch/i);
  });

  it("approve_completion requires admin secret key to match cert.admin_key", () => {
    const criteriaBytes = bytesFromTextFixed("criteria", 256);
    const adminSk = bytes32FromText("admin-secret");
    const userSk = bytes32FromText("user-secret");

    const contract = new CompletionRegistry.Contract({
      get_user_secret_key: () => [undefined, userSk],
      get_admin_secret_key: () => [undefined, adminSk],
      get_evidence_hash: () => [undefined, bytes32FromText("evidence-hash")],
      get_evidence_class_raw: () => [undefined, fixed8("AI_SCORE")],
      get_verification_score: () => [undefined, 88n],
      get_criteria_bytes: () => [undefined, criteriaBytes],
      get_req_evidence_class: () => [undefined, fixed8("AI_SCORE")],
      get_min_score_threshold: () => [undefined, 70n],
      get_freq_slots_required: () => [undefined, 0n],
      get_last_completion_slot: () => [undefined, 0n],
      get_current_slot: () => [undefined, 1234n],
      get_review_payload: () => [undefined, ZERO_256.slice()],
      get_commitment_payload: () => [undefined, ZERO_256.slice()],
      get_passed_flag: () => [undefined, true],
      get_score_band: () => [undefined, 3n],
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

    const onChainCommitment = contract._persistentHash_0(criteriaBytes);
    const adminKey = contract._derive_actor_key_0(
      bytesFromTextFixed("zkquest:creator:", 32),
      adminSk,
    );

    const created = contract.circuits.verify_completion(
      ctx,
      bytes32FromText("quest-1"),
      bytes32FromText("sprint-1"),
      bytes32FromText("space-1"),
      adminKey,
      onChainCommitment,
      100n,
    );

    const ledgerCreated = CompletionRegistry.ledger(
      created.context.currentQueryContext.state,
    );
    const certId = Array.from(ledgerCreated.completions)[0]![0];

    const approved = contract.circuits.approve_completion(
      created.context,
      certId,
      5n,
      2000n,
    );
    const ledgerApproved = CompletionRegistry.ledger(
      approved.context.currentQueryContext.state,
    );
    const cert = ledgerApproved.completions.lookup(certId);
    expect(cert.status).toBe(CompletionRegistry.CompletionStatus.APPROVED);
    expect(cert.reward_amount).toBe(5n);
    expect(cert.decision_slot).toBe(2000n);
  });
});

