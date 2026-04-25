import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.15.0');

export var RewardReservationStatus;
(function (RewardReservationStatus) {
  RewardReservationStatus[RewardReservationStatus['NONE'] = 0] = 'NONE';
  RewardReservationStatus[RewardReservationStatus['RESERVED'] = 1] = 'RESERVED';
  RewardReservationStatus[RewardReservationStatus['REJECTED'] = 2] = 'REJECTED';
  RewardReservationStatus[RewardReservationStatus['CLAIMED'] = 3] = 'CLAIMED';
})(RewardReservationStatus || (RewardReservationStatus = {}));

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_2 = __compactRuntime.CompactTypeBoolean;

class _QuestEscrowConfig_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment())))))));
  }
  fromValue(value_0) {
    return {
      quest_id: _descriptor_0.fromValue(value_0),
      admin_key: _descriptor_0.fromValue(value_0),
      asset_contract: _descriptor_0.fromValue(value_0),
      total_budget: _descriptor_1.fromValue(value_0),
      reserved_budget: _descriptor_1.fromValue(value_0),
      claimed_budget: _descriptor_1.fromValue(value_0),
      default_reward_amount: _descriptor_1.fromValue(value_0),
      active: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.quest_id).concat(_descriptor_0.toValue(value_0.admin_key).concat(_descriptor_0.toValue(value_0.asset_contract).concat(_descriptor_1.toValue(value_0.total_budget).concat(_descriptor_1.toValue(value_0.reserved_budget).concat(_descriptor_1.toValue(value_0.claimed_budget).concat(_descriptor_1.toValue(value_0.default_reward_amount).concat(_descriptor_2.toValue(value_0.active))))))));
  }
}

const _descriptor_3 = new _QuestEscrowConfig_0();

const _descriptor_4 = new __compactRuntime.CompactTypeEnum(3, 1);

class _RewardReservation_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_4.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()))))));
  }
  fromValue(value_0) {
    return {
      cert_id: _descriptor_0.fromValue(value_0),
      quest_id: _descriptor_0.fromValue(value_0),
      completer_key: _descriptor_0.fromValue(value_0),
      amount: _descriptor_1.fromValue(value_0),
      status: _descriptor_4.fromValue(value_0),
      approved_at_slot: _descriptor_1.fromValue(value_0),
      claimed_at_slot: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.cert_id).concat(_descriptor_0.toValue(value_0.quest_id).concat(_descriptor_0.toValue(value_0.completer_key).concat(_descriptor_1.toValue(value_0.amount).concat(_descriptor_4.toValue(value_0.status).concat(_descriptor_1.toValue(value_0.approved_at_slot).concat(_descriptor_1.toValue(value_0.claimed_at_slot)))))));
  }
}

const _descriptor_5 = new _RewardReservation_0();

const _descriptor_6 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

class _Either_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_2.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_7 = new _Either_0();

const _descriptor_8 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

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

const _descriptor_9 = new _ContractAddress_0();

const _descriptor_10 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

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
    if (typeof(witnesses_0.get_admin_secret_key) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_admin_secret_key');
    }
    if (typeof(witnesses_0.get_user_secret_key) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_user_secret_key');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      configure_quest_escrow: (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`configure_quest_escrow: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const quest_id_0 = args_1[1];
        const asset_contract_0 = args_1[2];
        const total_budget_0 = args_1[3];
        const default_reward_amount_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('configure_quest_escrow',
                                     'argument 1 (as invoked from Typescript)',
                                     'reward-escrow.compact line 37 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(quest_id_0.buffer instanceof ArrayBuffer && quest_id_0.BYTES_PER_ELEMENT === 1 && quest_id_0.length === 32)) {
          __compactRuntime.typeError('configure_quest_escrow',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'reward-escrow.compact line 37 char 1',
                                     'Bytes<32>',
                                     quest_id_0)
        }
        if (!(asset_contract_0.buffer instanceof ArrayBuffer && asset_contract_0.BYTES_PER_ELEMENT === 1 && asset_contract_0.length === 32)) {
          __compactRuntime.typeError('configure_quest_escrow',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'reward-escrow.compact line 37 char 1',
                                     'Bytes<32>',
                                     asset_contract_0)
        }
        if (!(typeof(total_budget_0) === 'bigint' && total_budget_0 >= 0n && total_budget_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('configure_quest_escrow',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'reward-escrow.compact line 37 char 1',
                                     'Uint<0..18446744073709551616>',
                                     total_budget_0)
        }
        if (!(typeof(default_reward_amount_0) === 'bigint' && default_reward_amount_0 >= 0n && default_reward_amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('configure_quest_escrow',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'reward-escrow.compact line 37 char 1',
                                     'Uint<0..18446744073709551616>',
                                     default_reward_amount_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(quest_id_0).concat(_descriptor_0.toValue(asset_contract_0).concat(_descriptor_1.toValue(total_budget_0).concat(_descriptor_1.toValue(default_reward_amount_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._configure_quest_escrow_0(context,
                                                        partialProofData,
                                                        quest_id_0,
                                                        asset_contract_0,
                                                        total_budget_0,
                                                        default_reward_amount_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      approve_reward: (...args_1) => {
        if (args_1.length !== 6) {
          throw new __compactRuntime.CompactError(`approve_reward: expected 6 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const cert_id_0 = args_1[1];
        const quest_id_0 = args_1[2];
        const completer_key_0 = args_1[3];
        const amount_0 = args_1[4];
        const approved_at_slot_0 = args_1[5];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('approve_reward',
                                     'argument 1 (as invoked from Typescript)',
                                     'reward-escrow.compact line 62 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(cert_id_0.buffer instanceof ArrayBuffer && cert_id_0.BYTES_PER_ELEMENT === 1 && cert_id_0.length === 32)) {
          __compactRuntime.typeError('approve_reward',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'reward-escrow.compact line 62 char 1',
                                     'Bytes<32>',
                                     cert_id_0)
        }
        if (!(quest_id_0.buffer instanceof ArrayBuffer && quest_id_0.BYTES_PER_ELEMENT === 1 && quest_id_0.length === 32)) {
          __compactRuntime.typeError('approve_reward',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'reward-escrow.compact line 62 char 1',
                                     'Bytes<32>',
                                     quest_id_0)
        }
        if (!(completer_key_0.buffer instanceof ArrayBuffer && completer_key_0.BYTES_PER_ELEMENT === 1 && completer_key_0.length === 32)) {
          __compactRuntime.typeError('approve_reward',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'reward-escrow.compact line 62 char 1',
                                     'Bytes<32>',
                                     completer_key_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('approve_reward',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'reward-escrow.compact line 62 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(typeof(approved_at_slot_0) === 'bigint' && approved_at_slot_0 >= 0n && approved_at_slot_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('approve_reward',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'reward-escrow.compact line 62 char 1',
                                     'Uint<0..18446744073709551616>',
                                     approved_at_slot_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(cert_id_0).concat(_descriptor_0.toValue(quest_id_0).concat(_descriptor_0.toValue(completer_key_0).concat(_descriptor_1.toValue(amount_0).concat(_descriptor_1.toValue(approved_at_slot_0))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._approve_reward_0(context,
                                                partialProofData,
                                                cert_id_0,
                                                quest_id_0,
                                                completer_key_0,
                                                amount_0,
                                                approved_at_slot_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      reject_reward: (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`reject_reward: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const cert_id_0 = args_1[1];
        const quest_id_0 = args_1[2];
        const completer_key_0 = args_1[3];
        const approved_at_slot_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('reject_reward',
                                     'argument 1 (as invoked from Typescript)',
                                     'reward-escrow.compact line 105 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(cert_id_0.buffer instanceof ArrayBuffer && cert_id_0.BYTES_PER_ELEMENT === 1 && cert_id_0.length === 32)) {
          __compactRuntime.typeError('reject_reward',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'reward-escrow.compact line 105 char 1',
                                     'Bytes<32>',
                                     cert_id_0)
        }
        if (!(quest_id_0.buffer instanceof ArrayBuffer && quest_id_0.BYTES_PER_ELEMENT === 1 && quest_id_0.length === 32)) {
          __compactRuntime.typeError('reject_reward',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'reward-escrow.compact line 105 char 1',
                                     'Bytes<32>',
                                     quest_id_0)
        }
        if (!(completer_key_0.buffer instanceof ArrayBuffer && completer_key_0.BYTES_PER_ELEMENT === 1 && completer_key_0.length === 32)) {
          __compactRuntime.typeError('reject_reward',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'reward-escrow.compact line 105 char 1',
                                     'Bytes<32>',
                                     completer_key_0)
        }
        if (!(typeof(approved_at_slot_0) === 'bigint' && approved_at_slot_0 >= 0n && approved_at_slot_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('reject_reward',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'reward-escrow.compact line 105 char 1',
                                     'Uint<0..18446744073709551616>',
                                     approved_at_slot_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(cert_id_0).concat(_descriptor_0.toValue(quest_id_0).concat(_descriptor_0.toValue(completer_key_0).concat(_descriptor_1.toValue(approved_at_slot_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._reject_reward_0(context,
                                               partialProofData,
                                               cert_id_0,
                                               quest_id_0,
                                               completer_key_0,
                                               approved_at_slot_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      claim_reward: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`claim_reward: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const cert_id_0 = args_1[1];
        const claimed_at_slot_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('claim_reward',
                                     'argument 1 (as invoked from Typescript)',
                                     'reward-escrow.compact line 129 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(cert_id_0.buffer instanceof ArrayBuffer && cert_id_0.BYTES_PER_ELEMENT === 1 && cert_id_0.length === 32)) {
          __compactRuntime.typeError('claim_reward',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'reward-escrow.compact line 129 char 1',
                                     'Bytes<32>',
                                     cert_id_0)
        }
        if (!(typeof(claimed_at_slot_0) === 'bigint' && claimed_at_slot_0 >= 0n && claimed_at_slot_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('claim_reward',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'reward-escrow.compact line 129 char 1',
                                     'Uint<0..18446744073709551616>',
                                     claimed_at_slot_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(cert_id_0).concat(_descriptor_1.toValue(claimed_at_slot_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._claim_reward_0(context,
                                              partialProofData,
                                              cert_id_0,
                                              claimed_at_slot_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      configure_quest_escrow: this.circuits.configure_quest_escrow,
      approve_reward: this.circuits.approve_reward,
      reject_reward: this.circuits.reject_reward,
      claim_reward: this.circuits.claim_reward
    };
    this.provableCircuits = {
      configure_quest_escrow: this.circuits.configure_quest_escrow,
      approve_reward: this.circuits.approve_reward,
      reject_reward: this.circuits.reject_reward,
      claim_reward: this.circuits.claim_reward
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
    state_0.setOperation('configure_quest_escrow', new __compactRuntime.ContractOperation());
    state_0.setOperation('approve_reward', new __compactRuntime.ContractOperation());
    state_0.setOperation('reject_reward', new __compactRuntime.ContractOperation());
    state_0.setOperation('claim_reward', new __compactRuntime.ContractOperation());
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
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(1n),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
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
    const result_0 = __compactRuntime.persistentHash(_descriptor_6, value_0);
    return result_0;
  }
  _get_admin_secret_key_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_admin_secret_key(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('get_admin_secret_key',
                                 'return value',
                                 'reward-escrow.compact line 30 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _get_user_secret_key_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_user_secret_key(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('get_user_secret_key',
                                 'return value',
                                 'reward-escrow.compact line 31 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _derive_actor_key_0(label_0, sk_0) {
    return this._persistentHash_0([label_0, sk_0]);
  }
  _configure_quest_escrow_0(context,
                            partialProofData,
                            quest_id_0,
                            asset_contract_0,
                            total_budget_0,
                            default_reward_amount_0)
  {
    const admin_sk_0 = this._get_admin_secret_key_0(context, partialProofData);
    const admin_key_0 = this._derive_actor_key_0(new Uint8Array([122, 107, 113, 117, 101, 115, 116, 58, 99, 114, 101, 97, 116, 111, 114, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                 admin_sk_0);
    const public_quest_id_0 = quest_id_0;
    __compactRuntime.assert(total_budget_0 > 0n,
                            'Escrow budget must be positive');
    __compactRuntime.assert(default_reward_amount_0 > 0n,
                            'Default reward amount must be positive');
    const tmp_0 = { quest_id: public_quest_id_0,
                    admin_key: admin_key_0,
                    asset_contract: asset_contract_0,
                    total_budget: total_budget_0,
                    reserved_budget: 0n,
                    claimed_budget: 0n,
                    default_reward_amount: default_reward_amount_0,
                    active: true };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_10.toValue(0n),
                                                                  alignment: _descriptor_10.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(public_quest_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _approve_reward_0(context,
                    partialProofData,
                    cert_id_0,
                    quest_id_0,
                    completer_key_0,
                    amount_0,
                    approved_at_slot_0)
  {
    const admin_sk_0 = this._get_admin_secret_key_0(context, partialProofData);
    const admin_key_0 = this._derive_actor_key_0(new Uint8Array([122, 107, 113, 117, 101, 115, 116, 58, 99, 114, 101, 97, 116, 111, 114, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                 admin_sk_0);
    const public_quest_id_0 = quest_id_0;
    const escrow_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_10.toValue(0n),
                                                                                                           alignment: _descriptor_10.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(public_quest_id_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    const public_cert_id_0 = cert_id_0;
    __compactRuntime.assert(escrow_0.active, 'Escrow inactive');
    __compactRuntime.assert(this._equal_0(admin_key_0, escrow_0.admin_key),
                            'Only quest admin can approve reward');
    __compactRuntime.assert(amount_0 > 0n, 'Reward amount must be positive');
    let t_0;
    __compactRuntime.assert((t_0 = ((t1) => {
                                     if (t1 > 18446744073709551615n) {
                                       throw new __compactRuntime.CompactError('reward-escrow.compact line 79 char 5: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                     }
                                     return t1;
                                   })(escrow_0.reserved_budget + amount_0),
                             t_0 <= escrow_0.total_budget),
                            'Escrow budget exhausted');
    const tmp_0 = { quest_id: escrow_0.quest_id,
                    admin_key: escrow_0.admin_key,
                    asset_contract: escrow_0.asset_contract,
                    total_budget: escrow_0.total_budget,
                    reserved_budget:
                      ((t1) => {
                        if (t1 > 18446744073709551615n) {
                          throw new __compactRuntime.CompactError('reward-escrow.compact line 88 char 31: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                        }
                        return t1;
                      })(escrow_0.reserved_budget + amount_0),
                    claimed_budget: escrow_0.claimed_budget,
                    default_reward_amount: escrow_0.default_reward_amount,
                    active: escrow_0.active };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_10.toValue(0n),
                                                                  alignment: _descriptor_10.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(public_quest_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = { cert_id: public_cert_id_0,
                    quest_id: public_quest_id_0,
                    completer_key: completer_key_0,
                    amount: amount_0,
                    status: 1,
                    approved_at_slot: approved_at_slot_0,
                    claimed_at_slot: 0n };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_10.toValue(1n),
                                                                  alignment: _descriptor_10.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(public_cert_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_1),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _reject_reward_0(context,
                   partialProofData,
                   cert_id_0,
                   quest_id_0,
                   completer_key_0,
                   approved_at_slot_0)
  {
    const admin_sk_0 = this._get_admin_secret_key_0(context, partialProofData);
    const admin_key_0 = this._derive_actor_key_0(new Uint8Array([122, 107, 113, 117, 101, 115, 116, 58, 99, 114, 101, 97, 116, 111, 114, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                 admin_sk_0);
    const escrow_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_10.toValue(0n),
                                                                                                           alignment: _descriptor_10.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(quest_id_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    __compactRuntime.assert(escrow_0.active, 'Escrow inactive');
    __compactRuntime.assert(this._equal_1(admin_key_0, escrow_0.admin_key),
                            'Only quest admin can reject reward');
    const tmp_0 = { cert_id: cert_id_0,
                    quest_id: quest_id_0,
                    completer_key: completer_key_0,
                    amount: 0n,
                    status: 2,
                    approved_at_slot: approved_at_slot_0,
                    claimed_at_slot: 0n };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_10.toValue(1n),
                                                                  alignment: _descriptor_10.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cert_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _claim_reward_0(context, partialProofData, cert_id_0, claimed_at_slot_0) {
    const user_sk_0 = this._get_user_secret_key_0(context, partialProofData);
    const reservation_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                    partialProofData,
                                                                                    [
                                                                                     { dup: { n: 0 } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_10.toValue(1n),
                                                                                                                alignment: _descriptor_10.alignment() } }] } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_0.toValue(cert_id_0),
                                                                                                                alignment: _descriptor_0.alignment() } }] } },
                                                                                     { popeq: { cached: false,
                                                                                                result: undefined } }]).value);
    let tmp_0;
    const escrow_0 = (tmp_0 = reservation_0.quest_id,
                      _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 0 } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_10.toValue(0n),
                                                                                                            alignment: _descriptor_10.alignment() } }] } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_0.toValue(tmp_0),
                                                                                                            alignment: _descriptor_0.alignment() } }] } },
                                                                                 { popeq: { cached: false,
                                                                                            result: undefined } }]).value));
    const claimer_key_0 = this._derive_actor_key_0(new Uint8Array([122, 107, 113, 117, 101, 115, 116, 58, 99, 111, 109, 112, 108, 101, 116, 101, 114, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                   user_sk_0);
    __compactRuntime.assert(reservation_0.status === 1, 'Reward not reserved');
    __compactRuntime.assert(this._equal_2(claimer_key_0,
                                          reservation_0.completer_key),
                            'Only recipient can claim');
    const tmp_1 = reservation_0.quest_id;
    const tmp_2 = { quest_id: escrow_0.quest_id,
                    admin_key: escrow_0.admin_key,
                    asset_contract: escrow_0.asset_contract,
                    total_budget: escrow_0.total_budget,
                    reserved_budget: escrow_0.reserved_budget,
                    claimed_budget:
                      ((t1) => {
                        if (t1 > 18446744073709551615n) {
                          throw new __compactRuntime.CompactError('reward-escrow.compact line 150 char 30: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                        }
                        return t1;
                      })(escrow_0.claimed_budget + reservation_0.amount),
                    default_reward_amount: escrow_0.default_reward_amount,
                    active: escrow_0.active };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_10.toValue(0n),
                                                                  alignment: _descriptor_10.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_2),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_3 = { cert_id: reservation_0.cert_id,
                    quest_id: reservation_0.quest_id,
                    completer_key: reservation_0.completer_key,
                    amount: reservation_0.amount,
                    status: 3,
                    approved_at_slot: reservation_0.approved_at_slot,
                    claimed_at_slot: claimed_at_slot_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_10.toValue(1n),
                                                                  alignment: _descriptor_10.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cert_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_3),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
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
    escrows: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_10.toValue(0n),
                                                                                                     alignment: _descriptor_10.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_10.toValue(0n),
                                                                                                     alignment: _descriptor_10.alignment() } }] } },
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
                                     'reward-escrow.compact line 27 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_10.toValue(0n),
                                                                                                     alignment: _descriptor_10.alignment() } }] } },
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
                                     'reward-escrow.compact line 27 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_10.toValue(0n),
                                                                                                     alignment: _descriptor_10.alignment() } }] } },
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
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_3.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    reservations: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_10.toValue(1n),
                                                                                                     alignment: _descriptor_10.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_10.toValue(1n),
                                                                                                     alignment: _descriptor_10.alignment() } }] } },
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
                                     'reward-escrow.compact line 28 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_10.toValue(1n),
                                                                                                     alignment: _descriptor_10.alignment() } }] } },
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
                                     'reward-escrow.compact line 28 char 1',
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
                                                                                            value: { value: _descriptor_10.toValue(1n),
                                                                                                     alignment: _descriptor_10.alignment() } }] } },
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
        const self_0 = state.asArray()[1];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_5.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  get_admin_secret_key: (...args) => undefined,
  get_user_secret_key: (...args) => undefined
});
export const pureCircuits = {};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
