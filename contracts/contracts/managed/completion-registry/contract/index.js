import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.15.0');

export var CompletionStatus;
(function (CompletionStatus) {
  CompletionStatus[CompletionStatus['PENDING_ADMIN'] = 0] = 'PENDING_ADMIN';
  CompletionStatus[CompletionStatus['APPROVED'] = 1] = 'APPROVED';
  CompletionStatus[CompletionStatus['REJECTED'] = 2] = 'REJECTED';
  CompletionStatus[CompletionStatus['CLAIMED'] = 3] = 'CLAIMED';
})(CompletionStatus || (CompletionStatus = {}));

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeBytes(8);

const _descriptor_2 = new __compactRuntime.CompactTypeEnum(3, 1);

const _descriptor_3 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_4 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_5 = __compactRuntime.CompactTypeBoolean;

const _descriptor_6 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

class _CompletionCert_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment().concat(_descriptor_3.alignment().concat(_descriptor_5.alignment().concat(_descriptor_6.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_0.alignment()))))))))))))))));
  }
  fromValue(value_0) {
    return {
      quest_id: _descriptor_0.fromValue(value_0),
      sprint_id: _descriptor_0.fromValue(value_0),
      space_id: _descriptor_0.fromValue(value_0),
      completer_key: _descriptor_0.fromValue(value_0),
      admin_key: _descriptor_0.fromValue(value_0),
      evidence_class: _descriptor_1.fromValue(value_0),
      status: _descriptor_2.fromValue(value_0),
      issued_at_slot: _descriptor_3.fromValue(value_0),
      xp_awarded: _descriptor_4.fromValue(value_0),
      reward_amount: _descriptor_3.fromValue(value_0),
      passed_flag: _descriptor_5.fromValue(value_0),
      score_band: _descriptor_6.fromValue(value_0),
      review_commitment: _descriptor_0.fromValue(value_0),
      commitment_commitment: _descriptor_0.fromValue(value_0),
      decision_slot: _descriptor_3.fromValue(value_0),
      claim_slot: _descriptor_3.fromValue(value_0),
      payout_reference: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.quest_id).concat(_descriptor_0.toValue(value_0.sprint_id).concat(_descriptor_0.toValue(value_0.space_id).concat(_descriptor_0.toValue(value_0.completer_key).concat(_descriptor_0.toValue(value_0.admin_key).concat(_descriptor_1.toValue(value_0.evidence_class).concat(_descriptor_2.toValue(value_0.status).concat(_descriptor_3.toValue(value_0.issued_at_slot).concat(_descriptor_4.toValue(value_0.xp_awarded).concat(_descriptor_3.toValue(value_0.reward_amount).concat(_descriptor_5.toValue(value_0.passed_flag).concat(_descriptor_6.toValue(value_0.score_band).concat(_descriptor_0.toValue(value_0.review_commitment).concat(_descriptor_0.toValue(value_0.commitment_commitment).concat(_descriptor_3.toValue(value_0.decision_slot).concat(_descriptor_3.toValue(value_0.claim_slot).concat(_descriptor_0.toValue(value_0.payout_reference)))))))))))))))));
  }
}

const _descriptor_7 = new _CompletionCert_0();

const _descriptor_8 = new __compactRuntime.CompactTypeBytes(256);

const _descriptor_9 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

const _descriptor_10 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

const _descriptor_11 = new __compactRuntime.CompactTypeVector(3, _descriptor_0);

class _Either_0 {
  alignment() {
    return _descriptor_5.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_5.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_5.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_12 = new _Either_0();

const _descriptor_13 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_14 = new _ContractAddress_0();

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.get_user_secret_key) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_user_secret_key');
    }
    if (typeof(witnesses_0.get_admin_secret_key) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_admin_secret_key');
    }
    if (typeof(witnesses_0.get_evidence_hash) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_evidence_hash');
    }
    if (typeof(witnesses_0.get_evidence_class_raw) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_evidence_class_raw');
    }
    if (typeof(witnesses_0.get_verification_score) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_verification_score');
    }
    if (typeof(witnesses_0.get_criteria_bytes) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_criteria_bytes');
    }
    if (typeof(witnesses_0.get_req_evidence_class) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_req_evidence_class');
    }
    if (typeof(witnesses_0.get_min_score_threshold) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_min_score_threshold');
    }
    if (typeof(witnesses_0.get_freq_slots_required) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_freq_slots_required');
    }
    if (typeof(witnesses_0.get_last_completion_slot) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_last_completion_slot');
    }
    if (typeof(witnesses_0.get_current_slot) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_current_slot');
    }
    if (typeof(witnesses_0.get_review_payload) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_review_payload');
    }
    if (typeof(witnesses_0.get_commitment_payload) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_commitment_payload');
    }
    if (typeof(witnesses_0.get_passed_flag) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_passed_flag');
    }
    if (typeof(witnesses_0.get_score_band) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_score_band');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      verify_completion: (...args_1) => {
        if (args_1.length !== 7) {
          throw new __compactRuntime.CompactError(`verify_completion: expected 7 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const quest_id_0 = args_1[1];
        const sprint_id_0 = args_1[2];
        const space_id_0 = args_1[3];
        const admin_key_0 = args_1[4];
        const on_chain_commitment_0 = args_1[5];
        const xp_value_0 = args_1[6];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('verify_completion',
                                     'argument 1 (as invoked from Typescript)',
                                     'completion-registry.compact line 48 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(quest_id_0.buffer instanceof ArrayBuffer && quest_id_0.BYTES_PER_ELEMENT === 1 && quest_id_0.length === 32)) {
          __compactRuntime.typeError('verify_completion',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'completion-registry.compact line 48 char 1',
                                     'Bytes<32>',
                                     quest_id_0)
        }
        if (!(sprint_id_0.buffer instanceof ArrayBuffer && sprint_id_0.BYTES_PER_ELEMENT === 1 && sprint_id_0.length === 32)) {
          __compactRuntime.typeError('verify_completion',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'completion-registry.compact line 48 char 1',
                                     'Bytes<32>',
                                     sprint_id_0)
        }
        if (!(space_id_0.buffer instanceof ArrayBuffer && space_id_0.BYTES_PER_ELEMENT === 1 && space_id_0.length === 32)) {
          __compactRuntime.typeError('verify_completion',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'completion-registry.compact line 48 char 1',
                                     'Bytes<32>',
                                     space_id_0)
        }
        if (!(admin_key_0.buffer instanceof ArrayBuffer && admin_key_0.BYTES_PER_ELEMENT === 1 && admin_key_0.length === 32)) {
          __compactRuntime.typeError('verify_completion',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'completion-registry.compact line 48 char 1',
                                     'Bytes<32>',
                                     admin_key_0)
        }
        if (!(on_chain_commitment_0.buffer instanceof ArrayBuffer && on_chain_commitment_0.BYTES_PER_ELEMENT === 1 && on_chain_commitment_0.length === 32)) {
          __compactRuntime.typeError('verify_completion',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'completion-registry.compact line 48 char 1',
                                     'Bytes<32>',
                                     on_chain_commitment_0)
        }
        if (!(typeof(xp_value_0) === 'bigint' && xp_value_0 >= 0n && xp_value_0 <= 65535n)) {
          __compactRuntime.typeError('verify_completion',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'completion-registry.compact line 48 char 1',
                                     'Uint<0..65536>',
                                     xp_value_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(quest_id_0).concat(_descriptor_0.toValue(sprint_id_0).concat(_descriptor_0.toValue(space_id_0).concat(_descriptor_0.toValue(admin_key_0).concat(_descriptor_0.toValue(on_chain_commitment_0).concat(_descriptor_4.toValue(xp_value_0)))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_4.alignment())))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._verify_completion_0(context,
                                                   partialProofData,
                                                   quest_id_0,
                                                   sprint_id_0,
                                                   space_id_0,
                                                   admin_key_0,
                                                   on_chain_commitment_0,
                                                   xp_value_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      approve_completion: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`approve_completion: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const cert_id_0 = args_1[1];
        const reward_amount_0 = args_1[2];
        const decision_slot_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('approve_completion',
                                     'argument 1 (as invoked from Typescript)',
                                     'completion-registry.compact line 130 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(cert_id_0.buffer instanceof ArrayBuffer && cert_id_0.BYTES_PER_ELEMENT === 1 && cert_id_0.length === 32)) {
          __compactRuntime.typeError('approve_completion',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'completion-registry.compact line 130 char 1',
                                     'Bytes<32>',
                                     cert_id_0)
        }
        if (!(typeof(reward_amount_0) === 'bigint' && reward_amount_0 >= 0n && reward_amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('approve_completion',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'completion-registry.compact line 130 char 1',
                                     'Uint<0..18446744073709551616>',
                                     reward_amount_0)
        }
        if (!(typeof(decision_slot_0) === 'bigint' && decision_slot_0 >= 0n && decision_slot_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('approve_completion',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'completion-registry.compact line 130 char 1',
                                     'Uint<0..18446744073709551616>',
                                     decision_slot_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(cert_id_0).concat(_descriptor_3.toValue(reward_amount_0).concat(_descriptor_3.toValue(decision_slot_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._approve_completion_0(context,
                                                    partialProofData,
                                                    cert_id_0,
                                                    reward_amount_0,
                                                    decision_slot_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      reject_completion: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`reject_completion: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const cert_id_0 = args_1[1];
        const decision_slot_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('reject_completion',
                                     'argument 1 (as invoked from Typescript)',
                                     'completion-registry.compact line 167 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(cert_id_0.buffer instanceof ArrayBuffer && cert_id_0.BYTES_PER_ELEMENT === 1 && cert_id_0.length === 32)) {
          __compactRuntime.typeError('reject_completion',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'completion-registry.compact line 167 char 1',
                                     'Bytes<32>',
                                     cert_id_0)
        }
        if (!(typeof(decision_slot_0) === 'bigint' && decision_slot_0 >= 0n && decision_slot_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('reject_completion',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'completion-registry.compact line 167 char 1',
                                     'Uint<0..18446744073709551616>',
                                     decision_slot_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(cert_id_0).concat(_descriptor_3.toValue(decision_slot_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_3.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._reject_completion_0(context,
                                                   partialProofData,
                                                   cert_id_0,
                                                   decision_slot_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      mark_reward_claimed: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`mark_reward_claimed: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const cert_id_0 = args_1[1];
        const claim_slot_0 = args_1[2];
        const payout_reference_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('mark_reward_claimed',
                                     'argument 1 (as invoked from Typescript)',
                                     'completion-registry.compact line 202 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(cert_id_0.buffer instanceof ArrayBuffer && cert_id_0.BYTES_PER_ELEMENT === 1 && cert_id_0.length === 32)) {
          __compactRuntime.typeError('mark_reward_claimed',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'completion-registry.compact line 202 char 1',
                                     'Bytes<32>',
                                     cert_id_0)
        }
        if (!(typeof(claim_slot_0) === 'bigint' && claim_slot_0 >= 0n && claim_slot_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('mark_reward_claimed',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'completion-registry.compact line 202 char 1',
                                     'Uint<0..18446744073709551616>',
                                     claim_slot_0)
        }
        if (!(payout_reference_0.buffer instanceof ArrayBuffer && payout_reference_0.BYTES_PER_ELEMENT === 1 && payout_reference_0.length === 32)) {
          __compactRuntime.typeError('mark_reward_claimed',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'completion-registry.compact line 202 char 1',
                                     'Bytes<32>',
                                     payout_reference_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(cert_id_0).concat(_descriptor_3.toValue(claim_slot_0).concat(_descriptor_0.toValue(payout_reference_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_0.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._mark_reward_claimed_0(context,
                                                     partialProofData,
                                                     cert_id_0,
                                                     claim_slot_0,
                                                     payout_reference_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      verify_completion: this.circuits.verify_completion,
      approve_completion: this.circuits.approve_completion,
      reject_completion: this.circuits.reject_completion,
      mark_reward_claimed: this.circuits.mark_reward_claimed
    };
    this.provableCircuits = {
      verify_completion: this.circuits.verify_completion,
      approve_completion: this.circuits.approve_completion,
      reject_completion: this.circuits.reject_completion,
      mark_reward_claimed: this.circuits.mark_reward_claimed
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('verify_completion', new __compactRuntime.ContractOperation());
    state_0.setOperation('approve_completion', new __compactRuntime.ContractOperation());
    state_0.setOperation('reject_completion', new __compactRuntime.ContractOperation());
    state_0.setOperation('mark_reward_claimed', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(0n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_8, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_11, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_10, value_0);
    return result_0;
  }
  _get_user_secret_key_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_user_secret_key(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('get_user_secret_key',
                                 'return value',
                                 'completion-registry.compact line 28 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _get_admin_secret_key_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_admin_secret_key(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('get_admin_secret_key',
                                 'return value',
                                 'completion-registry.compact line 29 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _get_evidence_hash_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_evidence_hash(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('get_evidence_hash',
                                 'return value',
                                 'completion-registry.compact line 30 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _get_evidence_class_raw_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_evidence_class_raw(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 8)) {
      __compactRuntime.typeError('get_evidence_class_raw',
                                 'return value',
                                 'completion-registry.compact line 31 char 1',
                                 'Bytes<8>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_1.toValue(result_0),
      alignment: _descriptor_1.alignment()
    });
    return result_0;
  }
  _get_verification_score_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_verification_score(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 4294967295n)) {
      __compactRuntime.typeError('get_verification_score',
                                 'return value',
                                 'completion-registry.compact line 32 char 1',
                                 'Uint<0..4294967296>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_9.toValue(result_0),
      alignment: _descriptor_9.alignment()
    });
    return result_0;
  }
  _get_criteria_bytes_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_criteria_bytes(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 256)) {
      __compactRuntime.typeError('get_criteria_bytes',
                                 'return value',
                                 'completion-registry.compact line 33 char 1',
                                 'Bytes<256>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_8.toValue(result_0),
      alignment: _descriptor_8.alignment()
    });
    return result_0;
  }
  _get_req_evidence_class_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_req_evidence_class(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 8)) {
      __compactRuntime.typeError('get_req_evidence_class',
                                 'return value',
                                 'completion-registry.compact line 34 char 1',
                                 'Bytes<8>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_1.toValue(result_0),
      alignment: _descriptor_1.alignment()
    });
    return result_0;
  }
  _get_min_score_threshold_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_min_score_threshold(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 4294967295n)) {
      __compactRuntime.typeError('get_min_score_threshold',
                                 'return value',
                                 'completion-registry.compact line 35 char 1',
                                 'Uint<0..4294967296>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_9.toValue(result_0),
      alignment: _descriptor_9.alignment()
    });
    return result_0;
  }
  _get_freq_slots_required_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_freq_slots_required(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('get_freq_slots_required',
                                 'return value',
                                 'completion-registry.compact line 36 char 1',
                                 'Uint<0..18446744073709551616>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_3.toValue(result_0),
      alignment: _descriptor_3.alignment()
    });
    return result_0;
  }
  _get_last_completion_slot_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_last_completion_slot(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('get_last_completion_slot',
                                 'return value',
                                 'completion-registry.compact line 37 char 1',
                                 'Uint<0..18446744073709551616>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_3.toValue(result_0),
      alignment: _descriptor_3.alignment()
    });
    return result_0;
  }
  _get_current_slot_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_current_slot(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('get_current_slot',
                                 'return value',
                                 'completion-registry.compact line 38 char 1',
                                 'Uint<0..18446744073709551616>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_3.toValue(result_0),
      alignment: _descriptor_3.alignment()
    });
    return result_0;
  }
  _get_review_payload_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_review_payload(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 256)) {
      __compactRuntime.typeError('get_review_payload',
                                 'return value',
                                 'completion-registry.compact line 39 char 1',
                                 'Bytes<256>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_8.toValue(result_0),
      alignment: _descriptor_8.alignment()
    });
    return result_0;
  }
  _get_commitment_payload_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_commitment_payload(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 256)) {
      __compactRuntime.typeError('get_commitment_payload',
                                 'return value',
                                 'completion-registry.compact line 40 char 1',
                                 'Bytes<256>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_8.toValue(result_0),
      alignment: _descriptor_8.alignment()
    });
    return result_0;
  }
  _get_passed_flag_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_passed_flag(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'boolean')) {
      __compactRuntime.typeError('get_passed_flag',
                                 'return value',
                                 'completion-registry.compact line 41 char 1',
                                 'Boolean',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_5.toValue(result_0),
      alignment: _descriptor_5.alignment()
    });
    return result_0;
  }
  _get_score_band_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_score_band(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 255n)) {
      __compactRuntime.typeError('get_score_band',
                                 'return value',
                                 'completion-registry.compact line 42 char 1',
                                 'Uint<0..256>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_6.toValue(result_0),
      alignment: _descriptor_6.alignment()
    });
    return result_0;
  }
  _derive_actor_key_0(label_0, sk_0) {
    return this._persistentHash_2([label_0, sk_0]);
  }
  _verify_completion_0(context,
                       partialProofData,
                       quest_id_0,
                       sprint_id_0,
                       space_id_0,
                       admin_key_0,
                       on_chain_commitment_0,
                       xp_value_0)
  {
    const user_sk_0 = this._get_user_secret_key_0(context, partialProofData);
    const evidence_hash_0 = this._get_evidence_hash_0(context, partialProofData);
    const evid_class_0 = this._get_evidence_class_raw_0(context,
                                                        partialProofData);
    const score_0 = this._get_verification_score_0(context, partialProofData);
    const crit_bytes_0 = this._get_criteria_bytes_0(context, partialProofData);
    const req_class_0 = this._get_req_evidence_class_0(context, partialProofData);
    const min_score_0 = this._get_min_score_threshold_0(context,
                                                        partialProofData);
    const freq_slots_0 = this._get_freq_slots_required_0(context,
                                                         partialProofData);
    const last_slot_0 = this._get_last_completion_slot_0(context,
                                                         partialProofData);
    const curr_slot_0 = this._get_current_slot_0(context, partialProofData);
    const review_payload_0 = this._get_review_payload_0(context,
                                                        partialProofData);
    const commitment_payload_0 = this._get_commitment_payload_0(context,
                                                                partialProofData);
    const passed_flag_0 = this._get_passed_flag_0(context, partialProofData);
    const score_band_0 = this._get_score_band_0(context, partialProofData);
    const computed_commitment_0 = this._persistentHash_0(crit_bytes_0);
    __compactRuntime.assert(this._equal_0(computed_commitment_0,
                                          on_chain_commitment_0),
                            'Criteria mismatch');
    __compactRuntime.assert(this._equal_1(evidence_hash_0,
                                          this._get_evidence_hash_0(context,
                                                                    partialProofData)),
                            'Evidence hash mismatch');
    __compactRuntime.assert(this._equal_2(evid_class_0, req_class_0),
                            'Evidence class mismatch');
    __compactRuntime.assert(score_0 >= min_score_0, 'Score below threshold');
    const completer_key_0 = this._derive_actor_key_0(new Uint8Array([122, 107, 113, 117, 101, 115, 116, 58, 99, 111, 109, 112, 108, 101, 116, 101, 114, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                     user_sk_0);
    __compactRuntime.assert(this._equal_3(freq_slots_0, 0n)
                            ||
                            this._equal_4(last_slot_0, 0n)
                            ||
                            curr_slot_0
                            >=
                            ((t1) => {
                              if (t1 > 18446744073709551615n) {
                                throw new __compactRuntime.CompactError('completion-registry.compact line 86 char 18: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                              }
                              return t1;
                            })(last_slot_0 + freq_slots_0),
                            'Frequency limit not met');
    __compactRuntime.assert(score_band_0 <= 3n,
                            'Score band must be in range 0-3');
    const review_commitment_0 = this._persistentHash_0(review_payload_0);
    const commitment_commitment_0 = this._persistentHash_0(commitment_payload_0);
    const public_quest_id_0 = quest_id_0;
    const public_completer_key_0 = completer_key_0;
    const public_admin_key_0 = admin_key_0;
    const public_review_commitment_0 = review_commitment_0;
    const public_commitment_commitment_0 = commitment_commitment_0;
    const cert_id_0 = this._persistentHash_1([public_quest_id_0,
                                              public_completer_key_0,
                                              public_commitment_commitment_0]);
    const tmp_0 = { quest_id: public_quest_id_0,
                    sprint_id: sprint_id_0,
                    space_id: space_id_0,
                    completer_key: public_completer_key_0,
                    admin_key: public_admin_key_0,
                    evidence_class: evid_class_0,
                    status: 0,
                    issued_at_slot: curr_slot_0,
                    xp_awarded: xp_value_0,
                    reward_amount: 0n,
                    passed_flag: passed_flag_0,
                    score_band: score_band_0,
                    review_commitment: public_review_commitment_0,
                    commitment_commitment: public_commitment_commitment_0,
                    decision_slot: 0n,
                    claim_slot: 0n,
                    payout_reference:
                      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(0n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cert_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_0),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return cert_id_0;
  }
  _approve_completion_0(context,
                        partialProofData,
                        cert_id_0,
                        reward_amount_0,
                        decision_slot_0)
  {
    const admin_sk_0 = this._get_admin_secret_key_0(context, partialProofData);
    const cert_0 = _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(0n),
                                                                                                         alignment: _descriptor_6.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(cert_id_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    const approver_key_0 = this._derive_actor_key_0(new Uint8Array([122, 107, 113, 117, 101, 115, 116, 58, 99, 114, 101, 97, 116, 111, 114, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                    admin_sk_0);
    __compactRuntime.assert(cert_0.status === 0, 'Completion not pending');
    __compactRuntime.assert(this._equal_5(approver_key_0, cert_0.admin_key),
                            'Only quest admin can approve');
    __compactRuntime.assert(reward_amount_0 > 0n,
                            'Reward amount must be positive');
    const tmp_0 = { quest_id: cert_0.quest_id,
                    sprint_id: cert_0.sprint_id,
                    space_id: cert_0.space_id,
                    completer_key: cert_0.completer_key,
                    admin_key: cert_0.admin_key,
                    evidence_class: cert_0.evidence_class,
                    status: 1,
                    issued_at_slot: cert_0.issued_at_slot,
                    xp_awarded: cert_0.xp_awarded,
                    reward_amount: reward_amount_0,
                    passed_flag: cert_0.passed_flag,
                    score_band: cert_0.score_band,
                    review_commitment: cert_0.review_commitment,
                    commitment_commitment: cert_0.commitment_commitment,
                    decision_slot: decision_slot_0,
                    claim_slot: cert_0.claim_slot,
                    payout_reference: cert_0.payout_reference };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(0n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cert_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_0),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _reject_completion_0(context, partialProofData, cert_id_0, decision_slot_0) {
    const admin_sk_0 = this._get_admin_secret_key_0(context, partialProofData);
    const cert_0 = _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(0n),
                                                                                                         alignment: _descriptor_6.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(cert_id_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    const approver_key_0 = this._derive_actor_key_0(new Uint8Array([122, 107, 113, 117, 101, 115, 116, 58, 99, 114, 101, 97, 116, 111, 114, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                    admin_sk_0);
    __compactRuntime.assert(cert_0.status === 0, 'Completion not pending');
    __compactRuntime.assert(this._equal_6(approver_key_0, cert_0.admin_key),
                            'Only quest admin can reject');
    const tmp_0 = { quest_id: cert_0.quest_id,
                    sprint_id: cert_0.sprint_id,
                    space_id: cert_0.space_id,
                    completer_key: cert_0.completer_key,
                    admin_key: cert_0.admin_key,
                    evidence_class: cert_0.evidence_class,
                    status: 2,
                    issued_at_slot: cert_0.issued_at_slot,
                    xp_awarded: cert_0.xp_awarded,
                    reward_amount: 0n,
                    passed_flag: cert_0.passed_flag,
                    score_band: cert_0.score_band,
                    review_commitment: cert_0.review_commitment,
                    commitment_commitment: cert_0.commitment_commitment,
                    decision_slot: decision_slot_0,
                    claim_slot: cert_0.claim_slot,
                    payout_reference: cert_0.payout_reference };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(0n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cert_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_0),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _mark_reward_claimed_0(context,
                         partialProofData,
                         cert_id_0,
                         claim_slot_0,
                         payout_reference_0)
  {
    const user_sk_0 = this._get_user_secret_key_0(context, partialProofData);
    const cert_0 = _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(0n),
                                                                                                         alignment: _descriptor_6.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(cert_id_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    const claimer_key_0 = this._derive_actor_key_0(new Uint8Array([122, 107, 113, 117, 101, 115, 116, 58, 99, 111, 109, 112, 108, 101, 116, 101, 114, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                   user_sk_0);
    __compactRuntime.assert(cert_0.status === 1, 'Completion not claimable');
    __compactRuntime.assert(this._equal_7(claimer_key_0, cert_0.completer_key),
                            'Only completer can claim');
    const tmp_0 = { quest_id: cert_0.quest_id,
                    sprint_id: cert_0.sprint_id,
                    space_id: cert_0.space_id,
                    completer_key: cert_0.completer_key,
                    admin_key: cert_0.admin_key,
                    evidence_class: cert_0.evidence_class,
                    status: 3,
                    issued_at_slot: cert_0.issued_at_slot,
                    xp_awarded: cert_0.xp_awarded,
                    reward_amount: cert_0.reward_amount,
                    passed_flag: cert_0.passed_flag,
                    score_band: cert_0.score_band,
                    review_commitment: cert_0.review_commitment,
                    commitment_commitment: cert_0.commitment_commitment,
                    decision_slot: cert_0.decision_slot,
                    claim_slot: claim_slot_0,
                    payout_reference: payout_reference_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(0n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cert_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_0),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_4(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_6(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    completions: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(0n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(0n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'completion-registry.compact line 26 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(0n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'completion-registry.compact line 26 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(0n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_7.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  get_user_secret_key: (...args) => undefined,
  get_admin_secret_key: (...args) => undefined,
  get_evidence_hash: (...args) => undefined,
  get_evidence_class_raw: (...args) => undefined,
  get_verification_score: (...args) => undefined,
  get_criteria_bytes: (...args) => undefined,
  get_req_evidence_class: (...args) => undefined,
  get_min_score_threshold: (...args) => undefined,
  get_freq_slots_required: (...args) => undefined,
  get_last_completion_slot: (...args) => undefined,
  get_current_slot: (...args) => undefined,
  get_review_payload: (...args) => undefined,
  get_commitment_payload: (...args) => undefined,
  get_passed_flag: (...args) => undefined,
  get_score_band: (...args) => undefined
});
export const pureCircuits = {};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
