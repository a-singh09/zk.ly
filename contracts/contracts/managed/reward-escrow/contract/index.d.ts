import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum RewardReservationStatus { NONE = 0,
                                      RESERVED = 1,
                                      REJECTED = 2,
                                      CLAIMED = 3
}

export type QuestEscrowConfig = { quest_id: Uint8Array;
                                  admin_key: Uint8Array;
                                  asset_contract: Uint8Array;
                                  total_budget: bigint;
                                  reserved_budget: bigint;
                                  claimed_budget: bigint;
                                  default_reward_amount: bigint;
                                  active: boolean
                                };

export type RewardReservation = { cert_id: Uint8Array;
                                  quest_id: Uint8Array;
                                  completer_key: Uint8Array;
                                  amount: bigint;
                                  status: RewardReservationStatus;
                                  approved_at_slot: bigint;
                                  claimed_at_slot: bigint
                                };

export type Witnesses<PS> = {
  get_admin_secret_key(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_user_secret_key(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  configure_quest_escrow(context: __compactRuntime.CircuitContext<PS>,
                         quest_id_0: Uint8Array,
                         asset_contract_0: Uint8Array,
                         total_budget_0: bigint,
                         default_reward_amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  approve_reward(context: __compactRuntime.CircuitContext<PS>,
                 cert_id_0: Uint8Array,
                 quest_id_0: Uint8Array,
                 completer_key_0: Uint8Array,
                 amount_0: bigint,
                 approved_at_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  reject_reward(context: __compactRuntime.CircuitContext<PS>,
                cert_id_0: Uint8Array,
                quest_id_0: Uint8Array,
                completer_key_0: Uint8Array,
                approved_at_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claim_reward(context: __compactRuntime.CircuitContext<PS>,
               cert_id_0: Uint8Array,
               claimed_at_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  configure_quest_escrow(context: __compactRuntime.CircuitContext<PS>,
                         quest_id_0: Uint8Array,
                         asset_contract_0: Uint8Array,
                         total_budget_0: bigint,
                         default_reward_amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  approve_reward(context: __compactRuntime.CircuitContext<PS>,
                 cert_id_0: Uint8Array,
                 quest_id_0: Uint8Array,
                 completer_key_0: Uint8Array,
                 amount_0: bigint,
                 approved_at_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  reject_reward(context: __compactRuntime.CircuitContext<PS>,
                cert_id_0: Uint8Array,
                quest_id_0: Uint8Array,
                completer_key_0: Uint8Array,
                approved_at_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claim_reward(context: __compactRuntime.CircuitContext<PS>,
               cert_id_0: Uint8Array,
               claimed_at_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  configure_quest_escrow(context: __compactRuntime.CircuitContext<PS>,
                         quest_id_0: Uint8Array,
                         asset_contract_0: Uint8Array,
                         total_budget_0: bigint,
                         default_reward_amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  approve_reward(context: __compactRuntime.CircuitContext<PS>,
                 cert_id_0: Uint8Array,
                 quest_id_0: Uint8Array,
                 completer_key_0: Uint8Array,
                 amount_0: bigint,
                 approved_at_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  reject_reward(context: __compactRuntime.CircuitContext<PS>,
                cert_id_0: Uint8Array,
                quest_id_0: Uint8Array,
                completer_key_0: Uint8Array,
                approved_at_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claim_reward(context: __compactRuntime.CircuitContext<PS>,
               cert_id_0: Uint8Array,
               claimed_at_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  escrows: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): QuestEscrowConfig;
    [Symbol.iterator](): Iterator<[Uint8Array, QuestEscrowConfig]>
  };
  reservations: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): RewardReservation;
    [Symbol.iterator](): Iterator<[Uint8Array, RewardReservation]>
  };
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
