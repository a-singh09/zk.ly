import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum CompletionStatus { PENDING_ADMIN = 0,
                               APPROVED = 1,
                               REJECTED = 2,
                               CLAIMED = 3
}

export type CompletionCert = { quest_id: Uint8Array;
                               sprint_id: Uint8Array;
                               space_id: Uint8Array;
                               completer_key: Uint8Array;
                               admin_key: Uint8Array;
                               evidence_class: Uint8Array;
                               status: CompletionStatus;
                               issued_at_slot: bigint;
                               xp_awarded: bigint;
                               reward_amount: bigint;
                               passed_flag: boolean;
                               score_band: bigint;
                               review_commitment: Uint8Array;
                               commitment_commitment: Uint8Array;
                               decision_slot: bigint;
                               claim_slot: bigint;
                               payout_reference: Uint8Array
                             };

export type Witnesses<PS> = {
  get_user_secret_key(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_admin_secret_key(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_evidence_hash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_evidence_class_raw(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_verification_score(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  get_criteria_bytes(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_req_evidence_class(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_min_score_threshold(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  get_freq_slots_required(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  get_last_completion_slot(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  get_current_slot(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  get_review_payload(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_commitment_payload(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_passed_flag(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, boolean];
  get_score_band(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  verify_completion(context: __compactRuntime.CircuitContext<PS>,
                    quest_id_0: Uint8Array,
                    sprint_id_0: Uint8Array,
                    space_id_0: Uint8Array,
                    admin_key_0: Uint8Array,
                    on_chain_commitment_0: Uint8Array,
                    xp_value_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  approve_completion(context: __compactRuntime.CircuitContext<PS>,
                     cert_id_0: Uint8Array,
                     reward_amount_0: bigint,
                     decision_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  reject_completion(context: __compactRuntime.CircuitContext<PS>,
                    cert_id_0: Uint8Array,
                    decision_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  mark_reward_claimed(context: __compactRuntime.CircuitContext<PS>,
                      cert_id_0: Uint8Array,
                      claim_slot_0: bigint,
                      payout_reference_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  verify_completion(context: __compactRuntime.CircuitContext<PS>,
                    quest_id_0: Uint8Array,
                    sprint_id_0: Uint8Array,
                    space_id_0: Uint8Array,
                    admin_key_0: Uint8Array,
                    on_chain_commitment_0: Uint8Array,
                    xp_value_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  approve_completion(context: __compactRuntime.CircuitContext<PS>,
                     cert_id_0: Uint8Array,
                     reward_amount_0: bigint,
                     decision_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  reject_completion(context: __compactRuntime.CircuitContext<PS>,
                    cert_id_0: Uint8Array,
                    decision_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  mark_reward_claimed(context: __compactRuntime.CircuitContext<PS>,
                      cert_id_0: Uint8Array,
                      claim_slot_0: bigint,
                      payout_reference_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  verify_completion(context: __compactRuntime.CircuitContext<PS>,
                    quest_id_0: Uint8Array,
                    sprint_id_0: Uint8Array,
                    space_id_0: Uint8Array,
                    admin_key_0: Uint8Array,
                    on_chain_commitment_0: Uint8Array,
                    xp_value_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  approve_completion(context: __compactRuntime.CircuitContext<PS>,
                     cert_id_0: Uint8Array,
                     reward_amount_0: bigint,
                     decision_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  reject_completion(context: __compactRuntime.CircuitContext<PS>,
                    cert_id_0: Uint8Array,
                    decision_slot_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  mark_reward_claimed(context: __compactRuntime.CircuitContext<PS>,
                      cert_id_0: Uint8Array,
                      claim_slot_0: bigint,
                      payout_reference_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  completions: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): CompletionCert;
    [Symbol.iterator](): Iterator<[Uint8Array, CompletionCert]>
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
