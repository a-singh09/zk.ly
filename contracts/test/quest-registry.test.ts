import { describe, expect, it } from "vitest";
import * as runtime from "@midnight-ntwrk/compact-runtime";

import { bytes32FromText, bytesFromTextFixed, ZERO_32, ZERO_256 } from "./utils.js";

import * as QuestRegistry from "../contracts/managed/quest-registry/contract/index.js";

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

describe("quest-registry circuits", () => {
  it("create_quest inserts a quest and discloses expected fields", () => {
    const contract = new QuestRegistry.Contract({
      caller_secret_key: () => [undefined, bytes32FromText("creator-secret")],
      get_criteria_bytes: () => [undefined, bytesFromTextFixed(`{"minScore":70}`, 256)],
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

    const spaceId = bytes32FromText("space-1");
    const sprintId = bytes32FromText("sprint-1");
    const questType = bytesFromTextFixed("blog", 8);
    const trackTag = bytesFromTextFixed("builder", 8);
    const freqSlots = 0n;
    const maxCompletions = 2n;
    const expiresAt = 999999n;
    const xpValue = 123n;
    const rewardMode = QuestRegistry.RewardMode.XP_ONLY;
    const escrowContract = ZERO_32.slice();
    const escrowAmount = 0n;
    const timestamp = bytesFromTextFixed("ts-1", 32);

    const call = contract.circuits.create_quest(
      ctx,
      spaceId,
      sprintId,
      questType,
      trackTag,
      freqSlots,
      maxCompletions,
      expiresAt,
      xpValue,
      rewardMode,
      escrowContract,
      escrowAmount,
      timestamp,
    );

    const ledgerState = QuestRegistry.ledger(call.context.currentQueryContext.state);
    expect(ledgerState.quest_count).toBe(1n);
    expect(ledgerState.quests.size()).toBe(1n);

    const [questId, quest] = Array.from(ledgerState.quests)[0]!;
    expect(questId).toBeInstanceOf(Uint8Array);
    expect(quest.space_id).toBeInstanceOf(Uint8Array);
    expect(quest.sprint_id).toBeInstanceOf(Uint8Array);
    expect(quest.criteria_commitment).toBeInstanceOf(Uint8Array);

    // Disclosed fields should match the input bytes
    expect(quest.space_id).toEqual(spaceId);
    expect(quest.sprint_id).toEqual(sprintId);
    expect(quest.quest_type).toEqual(questType);
    expect(quest.track_tag).toEqual(trackTag);
    expect(quest.max_completions).toBe(maxCompletions);
    expect(quest.xp_value).toBe(xpValue);
    expect(quest.reward_mode).toBe(rewardMode);
    expect(quest.escrow_amount).toBe(escrowAmount);
  });

  it("create_quest enforces escrow amount for ESCROW_AUTOMATIC", () => {
    const contract = new QuestRegistry.Contract({
      caller_secret_key: () => [undefined, bytes32FromText("creator-secret")],
      get_criteria_bytes: () => [undefined, ZERO_256.slice()],
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

    expect(() =>
      contract.circuits.create_quest(
        ctx,
        bytes32FromText("space-1"),
        bytes32FromText("sprint-1"),
        bytesFromTextFixed("blog", 8),
        bytesFromTextFixed("builder", 8),
        0n,
        0n,
        0n,
        1n,
        QuestRegistry.RewardMode.ESCROW_AUTOMATIC,
        ZERO_32.slice(),
        0n,
        bytesFromTextFixed("ts-1", 32),
      ),
    ).toThrow(/Escrow amount required/i);
  });

  it("increment_completion increases count and caps status at CAP_REACHED", () => {
    const contract = new QuestRegistry.Contract({
      caller_secret_key: () => [undefined, bytes32FromText("creator-secret")],
      get_criteria_bytes: () => [undefined, bytesFromTextFixed("criteria", 256)],
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

    const created = contract.circuits.create_quest(
      ctx,
      bytes32FromText("space-1"),
      bytes32FromText("sprint-1"),
      bytesFromTextFixed("blog", 8),
      bytesFromTextFixed("builder", 8),
      0n,
      2n,
      999999n,
      1n,
      QuestRegistry.RewardMode.XP_ONLY,
      ZERO_32.slice(),
      0n,
      bytesFromTextFixed("ts-1", 32),
    );

    const ledgerAfterCreate = QuestRegistry.ledger(
      created.context.currentQueryContext.state,
    );
    const questId = Array.from(ledgerAfterCreate.quests)[0]![0];

    const inc1 = contract.circuits.increment_completion(created.context, questId);
    const s1 = QuestRegistry.ledger(inc1.context.currentQueryContext.state);
    const q1 = s1.quests.lookup(questId);
    expect(q1.completion_count).toBe(1n);
    expect(q1.status).toBe(QuestRegistry.QuestStatus.ACTIVE);

    const inc2 = contract.circuits.increment_completion(inc1.context, questId);
    const s2 = QuestRegistry.ledger(inc2.context.currentQueryContext.state);
    const q2 = s2.quests.lookup(questId);
    expect(q2.completion_count).toBe(2n);
    expect(q2.status).toBe(QuestRegistry.QuestStatus.CAP_REACHED);
  });
});

