import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.15.0');

export var QuestStatus;
(function (QuestStatus) {
  QuestStatus[QuestStatus['ACTIVE'] = 0] = 'ACTIVE';
  QuestStatus[QuestStatus['PAUSED'] = 1] = 'PAUSED';
  QuestStatus[QuestStatus['EXPIRED'] = 2] = 'EXPIRED';
  QuestStatus[QuestStatus['CAP_REACHED'] = 3] = 'CAP_REACHED';
})(QuestStatus || (QuestStatus = {}));

export var RewardMode;
(function (RewardMode) {
  RewardMode[RewardMode['XP_ONLY'] = 0] = 'XP_ONLY';
  RewardMode[RewardMode['ESCROW_AUTOMATIC'] = 1] = 'ESCROW_AUTOMATIC';
})(RewardMode || (RewardMode = {}));

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeBytes(8);

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_3 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

const _descriptor_4 = new __compactRuntime.CompactTypeEnum(3, 1);

const _descriptor_5 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_6 = new __compactRuntime.CompactTypeEnum(1, 1);

class _QuestDefinition_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_2.alignment().concat(_descriptor_4.alignment().concat(_descriptor_5.alignment().concat(_descriptor_6.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment()))))))))))))));
  }
  fromValue(value_0) {
    return {
      space_id: _descriptor_0.fromValue(value_0),
      sprint_id: _descriptor_0.fromValue(value_0),
      creator_key: _descriptor_0.fromValue(value_0),
      quest_type: _descriptor_1.fromValue(value_0),
      track_tag: _descriptor_1.fromValue(value_0),
      criteria_commitment: _descriptor_0.fromValue(value_0),
      freq_slots: _descriptor_2.fromValue(value_0),
      max_completions: _descriptor_3.fromValue(value_0),
      completion_count: _descriptor_3.fromValue(value_0),
      expires_at_slot: _descriptor_2.fromValue(value_0),
      status: _descriptor_4.fromValue(value_0),
      xp_value: _descriptor_5.fromValue(value_0),
      reward_mode: _descriptor_6.fromValue(value_0),
      escrow_contract: _descriptor_0.fromValue(value_0),
      escrow_amount: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.space_id).concat(_descriptor_0.toValue(value_0.sprint_id).concat(_descriptor_0.toValue(value_0.creator_key).concat(_descriptor_1.toValue(value_0.quest_type).concat(_descriptor_1.toValue(value_0.track_tag).concat(_descriptor_0.toValue(value_0.criteria_commitment).concat(_descriptor_2.toValue(value_0.freq_slots).concat(_descriptor_3.toValue(value_0.max_completions).concat(_descriptor_3.toValue(value_0.completion_count).concat(_descriptor_2.toValue(value_0.expires_at_slot).concat(_descriptor_4.toValue(value_0.status).concat(_descriptor_5.toValue(value_0.xp_value).concat(_descriptor_6.toValue(value_0.reward_mode).concat(_descriptor_0.toValue(value_0.escrow_contract).concat(_descriptor_2.toValue(value_0.escrow_amount)))))))))))))));
  }
}

const _descriptor_7 = new _QuestDefinition_0();

const _descriptor_8 = new __compactRuntime.CompactTypeBytes(256);

const _descriptor_9 = new __compactRuntime.CompactTypeVector(3, _descriptor_0);

const _descriptor_10 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

const _descriptor_11 = __compactRuntime.CompactTypeBoolean;

class _Either_0 {
  alignment() {
    return _descriptor_11.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_11.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_11.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
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

const _descriptor_15 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

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
    if (typeof(witnesses_0.caller_secret_key) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named caller_secret_key');
    }
    if (typeof(witnesses_0.get_criteria_bytes) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_criteria_bytes');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      create_quest: (...args_1) => {
        if (args_1.length !== 13) {
          throw new __compactRuntime.CompactError(`create_quest: expected 13 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const space_id_0 = args_1[1];
        const sprint_id_0 = args_1[2];
        const quest_type_0 = args_1[3];
        const track_tag_0 = args_1[4];
        const freq_slots_0 = args_1[5];
        const max_completions_0 = args_1[6];
        const expires_at_slot_0 = args_1[7];
        const xp_value_0 = args_1[8];
        const reward_mode_0 = args_1[9];
        const escrow_contract_0 = args_1[10];
        const escrow_amount_0 = args_1[11];
        const timestamp_0 = args_1[12];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 1 (as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(space_id_0.buffer instanceof ArrayBuffer && space_id_0.BYTES_PER_ELEMENT === 1 && space_id_0.length === 32)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Bytes<32>',
                                     space_id_0)
        }
        if (!(sprint_id_0.buffer instanceof ArrayBuffer && sprint_id_0.BYTES_PER_ELEMENT === 1 && sprint_id_0.length === 32)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Bytes<32>',
                                     sprint_id_0)
        }
        if (!(quest_type_0.buffer instanceof ArrayBuffer && quest_type_0.BYTES_PER_ELEMENT === 1 && quest_type_0.length === 8)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Bytes<8>',
                                     quest_type_0)
        }
        if (!(track_tag_0.buffer instanceof ArrayBuffer && track_tag_0.BYTES_PER_ELEMENT === 1 && track_tag_0.length === 8)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Bytes<8>',
                                     track_tag_0)
        }
        if (!(typeof(freq_slots_0) === 'bigint' && freq_slots_0 >= 0n && freq_slots_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Uint<0..18446744073709551616>',
                                     freq_slots_0)
        }
        if (!(typeof(max_completions_0) === 'bigint' && max_completions_0 >= 0n && max_completions_0 <= 4294967295n)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Uint<0..4294967296>',
                                     max_completions_0)
        }
        if (!(typeof(expires_at_slot_0) === 'bigint' && expires_at_slot_0 >= 0n && expires_at_slot_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Uint<0..18446744073709551616>',
                                     expires_at_slot_0)
        }
        if (!(typeof(xp_value_0) === 'bigint' && xp_value_0 >= 0n && xp_value_0 <= 65535n)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 8 (argument 9 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Uint<0..65536>',
                                     xp_value_0)
        }
        if (!(typeof(reward_mode_0) === 'number' && reward_mode_0 >= 0 && reward_mode_0 <= 1)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 9 (argument 10 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Enum<RewardMode, XP_ONLY, ESCROW_AUTOMATIC>',
                                     reward_mode_0)
        }
        if (!(escrow_contract_0.buffer instanceof ArrayBuffer && escrow_contract_0.BYTES_PER_ELEMENT === 1 && escrow_contract_0.length === 32)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 10 (argument 11 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Bytes<32>',
                                     escrow_contract_0)
        }
        if (!(typeof(escrow_amount_0) === 'bigint' && escrow_amount_0 >= 0n && escrow_amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 11 (argument 12 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Uint<0..18446744073709551616>',
                                     escrow_amount_0)
        }
        if (!(timestamp_0.buffer instanceof ArrayBuffer && timestamp_0.BYTES_PER_ELEMENT === 1 && timestamp_0.length === 32)) {
          __compactRuntime.typeError('create_quest',
                                     'argument 12 (argument 13 as invoked from Typescript)',
                                     'quest-registry.compact line 38 char 1',
                                     'Bytes<32>',
                                     timestamp_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(space_id_0).concat(_descriptor_0.toValue(sprint_id_0).concat(_descriptor_1.toValue(quest_type_0).concat(_descriptor_1.toValue(track_tag_0).concat(_descriptor_2.toValue(freq_slots_0).concat(_descriptor_3.toValue(max_completions_0).concat(_descriptor_2.toValue(expires_at_slot_0).concat(_descriptor_5.toValue(xp_value_0).concat(_descriptor_6.toValue(reward_mode_0).concat(_descriptor_0.toValue(escrow_contract_0).concat(_descriptor_2.toValue(escrow_amount_0).concat(_descriptor_0.toValue(timestamp_0)))))))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_3.alignment().concat(_descriptor_2.alignment().concat(_descriptor_5.alignment().concat(_descriptor_6.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment())))))))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._create_quest_0(context,
                                              partialProofData,
                                              space_id_0,
                                              sprint_id_0,
                                              quest_type_0,
                                              track_tag_0,
                                              freq_slots_0,
                                              max_completions_0,
                                              expires_at_slot_0,
                                              xp_value_0,
                                              reward_mode_0,
                                              escrow_contract_0,
                                              escrow_amount_0,
                                              timestamp_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      increment_completion: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`increment_completion: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const quest_id_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('increment_completion',
                                     'argument 1 (as invoked from Typescript)',
                                     'quest-registry.compact line 91 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(quest_id_0.buffer instanceof ArrayBuffer && quest_id_0.BYTES_PER_ELEMENT === 1 && quest_id_0.length === 32)) {
          __compactRuntime.typeError('increment_completion',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'quest-registry.compact line 91 char 1',
                                     'Bytes<32>',
                                     quest_id_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(quest_id_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._increment_completion_0(context,
                                                      partialProofData,
                                                      quest_id_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      create_quest: this.circuits.create_quest,
      increment_completion: this.circuits.increment_completion
    };
    this.provableCircuits = {
      create_quest: this.circuits.create_quest,
      increment_completion: this.circuits.increment_completion
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
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('create_quest', new __compactRuntime.ContractOperation());
    state_0.setOperation('increment_completion', new __compactRuntime.ContractOperation());
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
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(1n),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_10, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_8, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_9, value_0);
    return result_0;
  }
  _caller_secret_key_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.caller_secret_key(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('caller_secret_key',
                                 'return value',
                                 'quest-registry.compact line 28 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
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
                                 'quest-registry.compact line 29 char 1',
                                 'Bytes<256>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_8.toValue(result_0),
      alignment: _descriptor_8.alignment()
    });
    return result_0;
  }
  _derive_creator_key_0(sk_0) {
    return this._persistentHash_0([new Uint8Array([122, 107, 113, 117, 101, 115, 116, 58, 99, 114, 101, 97, 116, 111, 114, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   sk_0]);
  }
  _create_quest_0(context,
                  partialProofData,
                  space_id_0,
                  sprint_id_0,
                  quest_type_0,
                  track_tag_0,
                  freq_slots_0,
                  max_completions_0,
                  expires_at_slot_0,
                  xp_value_0,
                  reward_mode_0,
                  escrow_contract_0,
                  escrow_amount_0,
                  timestamp_0)
  {
    const sk_0 = this._caller_secret_key_0(context, partialProofData);
    const creator_key_0 = this._derive_creator_key_0(sk_0);
    const criteria_bytes_0 = this._get_criteria_bytes_0(context,
                                                        partialProofData);
    const criteria_commitment_0 = this._persistentHash_1(criteria_bytes_0);
    const quest_id_0 = this._persistentHash_2([creator_key_0,
                                               criteria_commitment_0,
                                               timestamp_0]);
    const public_quest_id_0 = quest_id_0;
    __compactRuntime.assert(reward_mode_0 === 0 || escrow_amount_0 > 0n,
                            'Escrow amount required for automatic escrow rewards');
    const tmp_0 = { space_id: space_id_0,
                    sprint_id: sprint_id_0,
                    creator_key: creator_key_0,
                    quest_type: quest_type_0,
                    track_tag: track_tag_0,
                    criteria_commitment: criteria_commitment_0,
                    freq_slots: freq_slots_0,
                    max_completions: max_completions_0,
                    completion_count: 0n,
                    expires_at_slot: expires_at_slot_0,
                    status: 0,
                    xp_value: xp_value_0,
                    reward_mode: reward_mode_0,
                    escrow_contract: escrow_contract_0,
                    escrow_amount: escrow_amount_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_15.toValue(0n),
                                                                  alignment: _descriptor_15.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(public_quest_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_0),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_15.toValue(1n),
                                                                  alignment: _descriptor_15.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_5.toValue(tmp_1),
                                                                alignment: _descriptor_5.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return public_quest_id_0;
  }
  _increment_completion_0(context, partialProofData, quest_id_0) {
    const public_quest_id_0 = quest_id_0;
    const rec_0 = _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_15.toValue(0n),
                                                                                                        alignment: _descriptor_15.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_0.toValue(public_quest_id_0),
                                                                                                        alignment: _descriptor_0.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    __compactRuntime.assert(rec_0.status === 0, 'Quest not active');
    const new_count_0 = ((t1) => {
                          if (t1 > 4294967295n) {
                            throw new __compactRuntime.CompactError('quest-registry.compact line 96 char 21: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 4294967295');
                          }
                          return t1;
                        })(rec_0.completion_count + 1n);
    let t_0;
    const tmp_0 = { space_id: rec_0.space_id,
                    sprint_id: rec_0.sprint_id,
                    creator_key: rec_0.creator_key,
                    quest_type: rec_0.quest_type,
                    track_tag: rec_0.track_tag,
                    criteria_commitment: rec_0.criteria_commitment,
                    freq_slots: rec_0.freq_slots,
                    max_completions: rec_0.max_completions,
                    completion_count: new_count_0,
                    expires_at_slot: rec_0.expires_at_slot,
                    status:
                      (t_0 = rec_0.max_completions, t_0 > 0n)
                      &&
                      new_count_0 >= rec_0.max_completions
                      ?
                      3 :
                      rec_0.status,
                    xp_value: rec_0.xp_value,
                    reward_mode: rec_0.reward_mode,
                    escrow_contract: rec_0.escrow_contract,
                    escrow_amount: rec_0.escrow_amount };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_15.toValue(0n),
                                                                  alignment: _descriptor_15.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(public_quest_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_0),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
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
    quests: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_15.toValue(0n),
                                                                                                      alignment: _descriptor_15.alignment() } }] } },
                                                                           'size',
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                  alignment: _descriptor_2.alignment() }).encode() } },
                                                                           'eq',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_15.toValue(0n),
                                                                                                     alignment: _descriptor_15.alignment() } }] } },
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
                                     'quest-registry.compact line 25 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_15.toValue(0n),
                                                                                                      alignment: _descriptor_15.alignment() } }] } },
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
                                     'quest-registry.compact line 25 char 1',
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
                                                                                            value: { value: _descriptor_15.toValue(0n),
                                                                                                     alignment: _descriptor_15.alignment() } }] } },
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
    },
    get quest_count() {
      return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_15.toValue(1n),
                                                                                                   alignment: _descriptor_15.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  caller_secret_key: (...args) => undefined,
  get_criteria_bytes: (...args) => undefined
});
export const pureCircuits = {};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
