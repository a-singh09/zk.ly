import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum QuestStatus { ACTIVE = 0, PAUSED = 1, EXPIRED = 2, CAP_REACHED = 3 }

export enum RewardMode { XP_ONLY = 0, ESCROW_AUTOMATIC = 1 }

export type QuestDefinition = { space_id: Uint8Array;
                                sprint_id: Uint8Array;
                                creator_key: Uint8Array;
                                quest_type: Uint8Array;
                                track_tag: Uint8Array;
                                criteria_commitment: Uint8Array;
                                freq_slots: bigint;
                                max_completions: bigint;
                                completion_count: bigint;
                                expires_at_slot: bigint;
                                status: QuestStatus;
                                xp_value: bigint;
                                reward_mode: RewardMode;
                                escrow_contract: Uint8Array;
                                escrow_amount: bigint
                              };

export type Witnesses<PS> = {
  caller_secret_key(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_criteria_bytes(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  create_quest(context: __compactRuntime.CircuitContext<PS>,
               space_id_0: Uint8Array,
               sprint_id_0: Uint8Array,
               quest_type_0: Uint8Array,
               track_tag_0: Uint8Array,
               freq_slots_0: bigint,
               max_completions_0: bigint,
               expires_at_slot_0: bigint,
               xp_value_0: bigint,
               reward_mode_0: RewardMode,
               escrow_contract_0: Uint8Array,
               escrow_amount_0: bigint,
               timestamp_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  increment_completion(context: __compactRuntime.CircuitContext<PS>,
                       quest_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  create_quest(context: __compactRuntime.CircuitContext<PS>,
               space_id_0: Uint8Array,
               sprint_id_0: Uint8Array,
               quest_type_0: Uint8Array,
               track_tag_0: Uint8Array,
               freq_slots_0: bigint,
               max_completions_0: bigint,
               expires_at_slot_0: bigint,
               xp_value_0: bigint,
               reward_mode_0: RewardMode,
               escrow_contract_0: Uint8Array,
               escrow_amount_0: bigint,
               timestamp_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  increment_completion(context: __compactRuntime.CircuitContext<PS>,
                       quest_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  create_quest(context: __compactRuntime.CircuitContext<PS>,
               space_id_0: Uint8Array,
               sprint_id_0: Uint8Array,
               quest_type_0: Uint8Array,
               track_tag_0: Uint8Array,
               freq_slots_0: bigint,
               max_completions_0: bigint,
               expires_at_slot_0: bigint,
               xp_value_0: bigint,
               reward_mode_0: RewardMode,
               escrow_contract_0: Uint8Array,
               escrow_amount_0: bigint,
               timestamp_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  increment_completion(context: __compactRuntime.CircuitContext<PS>,
                       quest_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  quests: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): QuestDefinition;
    [Symbol.iterator](): Iterator<[Uint8Array, QuestDefinition]>
  };
  readonly quest_count: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
