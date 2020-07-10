/*
 *  (c) 2020 IOV SAS
 *  (c) 2019 ZondaX GmbH
 *  (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import Transport from "@ledgerhq/hw-transport";

const CLA = 0x55;
const CHUNK_SIZE = 250;
const APP_KEY = "IOV";

const IOV_COIN_TYPE = 234;
const HRP = "star";

const INS = {
  GET_VERSION: 0x00,
  INS_PUBLIC_KEY_SECP256K1: 0x01, // Obsolete
  SIGN_SECP256K1: 0x02,
  GET_ADDR_SECP256K1: 0x04,
};

const PAYLOAD_TYPE = {
  INIT: 0x00,
  ADD: 0x01,
  LAST: 0x02,
};

const P1_VALUES = {
  ONLY_RETRIEVE: 0x00,
  SHOW_ADDRESS_IN_DEVICE: 0x01,
};

export const ERROR_CODE = {
  NoError: 0x9000,
};

const ERROR_DESCRIPTION: { readonly [index: number]: string } = {
  1: "U2F: Unknown",
  2: "U2F: Bad request",
  3: "U2F: Configuration unsupported",
  4: "U2F: Device Ineligible",
  5: "U2F: Timeout",
  14: "Timeout",
  0x9000: "No errors",
  0x9001: "Device is busy",
  0x6802: "Error deriving keys",
  0x6400: "Execution Error",
  0x6700: "Wrong Length",
  0x6982: "Empty Buffer",
  0x6983: "Output buffer too small",
  0x6984: "Data is invalid",
  0x6985: "Conditions not satisfied",
  0x6986: "Transaction rejected",
  0x6a80: "Bad key handle",
  0x6b00: "Invalid P1/P2",
  0x6d00: "Instruction not supported",
  0x6e00: "Ledger app does not seem to be open",
  0x6f00: "Unknown error",
  0x6f01: "Sign/verify error",
};

function errorCodeToString(statusCode: number): string {
  if (statusCode in ERROR_DESCRIPTION) return ERROR_DESCRIPTION[statusCode];
  return `Unknown Status Code: ${statusCode}`;
}

function harden(index: number): number {
  // Don't use bitwise operations, which result in signed int32 in JavaScript
  return 0x80000000 + index;
}

export interface IovLedgerAppErrorState {
  readonly returnCode: number;
  readonly errorMessage: string;
}

export interface IovLedgerAppVersion extends IovLedgerAppErrorState {
  readonly testMode: boolean;
  readonly version: string;
  readonly deviceLocked: boolean;
  readonly targetId: string;
}

export function isIovLedgerAppVersion(data: IovLedgerAppVersion | IovLedgerAppErrorState): data is IovLedgerAppVersion {
  return (
    typeof (data as IovLedgerAppVersion).testMode !== "undefined" &&
    typeof (data as IovLedgerAppVersion).version === "string" &&
    typeof (data as IovLedgerAppVersion).deviceLocked !== "undefined"
  );
}

export interface IovLedgerAppAddress extends IovLedgerAppErrorState {
  readonly pubkey: Uint8Array;
  readonly address: string;
}

export interface IovLedgerAppInfo extends IovLedgerAppErrorState {
  readonly appName: string;
  readonly appVersion: string;
  readonly flagLen: number;
  readonly flagsValue: number;
  readonly flagRecovery: boolean;
  readonly flagSignedMcuCode: boolean;
  readonly flagOnboarded: boolean;
  readonly flagPinValidated: boolean;
}

export function isIovLedgerAppInfo(data: IovLedgerAppInfo | IovLedgerAppErrorState): data is IovLedgerAppInfo {
  return (
    typeof (data as IovLedgerAppInfo).appName === "string" &&
    typeof (data as IovLedgerAppInfo).appVersion === "string" &&
    typeof (data as IovLedgerAppInfo).flagLen === "number" &&
    typeof (data as IovLedgerAppInfo).flagsValue === "number" &&
    typeof (data as IovLedgerAppInfo).flagRecovery === "boolean" &&
    typeof (data as IovLedgerAppInfo).flagSignedMcuCode === "boolean" &&
    typeof (data as IovLedgerAppInfo).flagOnboarded === "boolean" &&
    typeof (data as IovLedgerAppInfo).flagPinValidated === "boolean"
  );
}

export function isIovLedgerAppAddress(data: IovLedgerAppAddress | IovLedgerAppErrorState): data is IovLedgerAppAddress {
  return typeof (data as IovLedgerAppAddress).address !== "undefined";
}

export interface IovLedgerAppSignature extends IovLedgerAppErrorState {
  readonly signature: Uint8Array;
}

export function isIovLedgerAppSignature(
  data: IovLedgerAppSignature | IovLedgerAppErrorState,
): data is IovLedgerAppSignature {
  return (data as IovLedgerAppSignature).signature.length > 0;
}

export class IovLedgerApp {
  public static sortObject(unsorted: any): object | readonly any[] | string | number {
    if (Array.isArray(unsorted)) return unsorted.map(IovLedgerApp.sortObject);

    if (typeof unsorted !== "object") return unsorted;

    return Object.keys(unsorted)
      .sort()
      .reduce((o, key: string) => {
        // tslint:disable-next-line no-object-mutation
        if (unsorted[key]) o[key] = IovLedgerApp.sortObject(unsorted[key]);

        return o;
        // tslint:disable-next-line readonly-keyword
      }, {} as { [key: string]: any });
  }

  public static serializeHRP(hrp: string = HRP): Buffer {
    if (hrp == null || hrp.length < 3 || hrp.length > 83) {
      throw new Error("Invalid HRP");
    }

    const buf = Buffer.alloc(1 + hrp.length);

    buf.writeUInt8(hrp.length, 0);
    buf.write(hrp, 1);

    return buf;
  }

  public static serializeBIP32(accountIndex: number): Buffer {
    if (!Number.isInteger(accountIndex)) throw new Error("Input must be an integer");
    if (accountIndex < 0 || accountIndex > 2 ** 31 - 1) throw new Error("Index is out of range");

    const buf = Buffer.alloc(20);
    buf.writeUInt32LE(harden(44), 0);
    buf.writeUInt32LE(harden(IOV_COIN_TYPE), 4);
    buf.writeUInt32LE(harden(accountIndex), 8);
    buf.writeUInt32LE(0, 12);
    buf.writeUInt32LE(0, 16);
    return buf;
  }

  public static signGetChunks(addressIndex: number, message: string): readonly Buffer[] {
    // tslint:disable-next-line: readonly-array
    const chunks = [];
    const bip32Path = IovLedgerApp.serializeBIP32(addressIndex);
    chunks.push(bip32Path);

    const buffer = Buffer.from(message);

    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      let end = i + CHUNK_SIZE;
      if (i > buffer.length) {
        end = buffer.length;
      }
      chunks.push(buffer.slice(i, end));
    }

    return chunks;
  }

  private static processErrorResponse(response: unknown): IovLedgerAppErrorState {
    if (typeof response !== "object" || response === null) {
      throw new Error(`Expected non-null object but got: ${typeof response}`);
    }

    const { statusCode } = response as { readonly statusCode: unknown };

    if (typeof statusCode !== "number") {
      throw new Error(`Expected statusCode of type number but got ${typeof statusCode}`);
    }

    return {
      returnCode: statusCode,
      errorMessage: errorCodeToString(statusCode),
    };
  }

  private readonly transport: Transport;
  private readonly hrp: string;

  constructor(transport: Transport, hrp = HRP) {
    if (!transport) {
      throw new Error("Transport has not been defined");
    }

    this.transport = transport;
    this.transport.decorateAppAPIMethods(this, ["appInfo", "getVersion", "getAddress", "sign"], APP_KEY);
    this.hrp = hrp;
  }

  public async getVersion(): Promise<IovLedgerAppVersion | IovLedgerAppErrorState> {
    return this.transport.send(CLA, INS.GET_VERSION, 0, 0).then(response => {
      if (response.length < 6) throw new Error(`Response data too short: ${response}`);

      const errorCodeData = response.slice(-2);
      const errorCode = errorCodeData[0] * 256 + errorCodeData[1];

      let targetId = 0;
      if (response.length >= 9) {
        targetId = (response[5] << 24) + (response[6] << 16) + (response[7] << 8) + (response[8] << 0);
      }

      const success: IovLedgerAppVersion = {
        testMode: response[0] !== 0,
        version: `${response[1]}.${response[2]}.${response[3]}`,
        deviceLocked: response[4] === 1,
        returnCode: errorCode,
        errorMessage: errorCodeToString(errorCode),
        targetId: targetId.toString(16),
      };
      return success;
    }, IovLedgerApp.processErrorResponse);
  }

  public async getAddress(
    addressIndex: number,
    requireConfirmation = false,
  ): Promise<IovLedgerAppAddress | IovLedgerAppErrorState> {
    const bip32Path = IovLedgerApp.serializeBIP32(addressIndex);
    const hrp = IovLedgerApp.serializeHRP(this.hrp);
    const data = Buffer.from([...hrp, ...bip32Path]);
    const p1 = requireConfirmation ? P1_VALUES.SHOW_ADDRESS_IN_DEVICE : P1_VALUES.ONLY_RETRIEVE;

    return this.transport.send(CLA, INS.GET_ADDR_SECP256K1, p1, 0, data, [ERROR_CODE.NoError]).then(response => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

      const compressedPk = new Uint8Array([...response.slice(0, 33)]);
      const bech32Address = Buffer.from(response.slice(33, -2)).toString("ascii");

      const success: IovLedgerAppAddress = {
        pubkey: compressedPk,
        address: bech32Address,
        returnCode: returnCode,
        errorMessage: errorCodeToString(returnCode),
      };

      return success;
    }, IovLedgerApp.processErrorResponse);
  }

  public async sign(
    addressIndex: number,
    message: string | object,
  ): Promise<IovLedgerAppSignature | IovLedgerAppErrorState> {
    const msg = typeof message === "string" ? message : JSON.stringify(IovLedgerApp.sortObject(message));
    const chunks = IovLedgerApp.signGetChunks(addressIndex, msg);
    return this.signSendChunk(1, chunks.length, chunks[0]).then(async result => {
      let latestResult = result;
      for (let i = 1; i < chunks.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop,no-param-reassign
        latestResult = await this.signSendChunk(1 + i, chunks.length, chunks[i]);
        if (result.returnCode !== ERROR_CODE.NoError) {
          break;
        }
      }

      if (!isIovLedgerAppSignature(latestResult)) return latestResult;

      const signed: IovLedgerAppSignature = {
        returnCode: latestResult.returnCode,
        signature: latestResult.signature,
        errorMessage: latestResult.errorMessage,
      };

      return signed;
    }, IovLedgerApp.processErrorResponse);
  }

  private async signSendChunk(
    chunkIdx: number,
    chunkNum: number,
    chunk: Buffer,
  ): Promise<IovLedgerAppSignature | IovLedgerAppErrorState> {
    let payloadType = PAYLOAD_TYPE.ADD;
    if (chunkIdx === 1) {
      payloadType = PAYLOAD_TYPE.INIT;
    }
    if (chunkIdx === chunkNum) {
      payloadType = PAYLOAD_TYPE.LAST;
    }

    return this.transport
      .send(CLA, INS.SIGN_SECP256K1, payloadType, 0, chunk, [ERROR_CODE.NoError, 0x6984, 0x6a80])
      .then(response => {
        if (response.length < 2) {
          throw new Error("Response too short to cut status code");
        }

        const errorCodeData = response.slice(-2);
        const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
        let errorMessage = errorCodeToString(returnCode);

        let signature = new Uint8Array();
        if (returnCode === 0x6a80 || returnCode === 0x6984) {
          errorMessage = `${errorMessage} : ${response.slice(0, response.length - 2).toString("ascii")}`;
        } else {
          signature = Uint8Array.from(response.slice(0, response.length - 2));
        }

        return {
          signature: signature,
          returnCode: returnCode,
          errorMessage: errorMessage,
        };
      }, IovLedgerApp.processErrorResponse);
  }

  public async getAppInfo(): Promise<IovLedgerAppInfo | IovLedgerAppErrorState> {
    return this.transport.send(0xb0, 0x01, 0, 0).then(response => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

      if (response[0] !== 1) {
        // Ledger responds with format ID 1. There is no spec for any format != 1
        return {
          // short-circuit
          errorMessage: "response format ID not recognized",
          returnCode: 0x9001,
        };
      }

      const appNameLen = response[1];
      const appName = response.slice(2, 2 + appNameLen).toString("ascii");

      let idx = 2 + appNameLen;
      const appVersionLen = response[idx];

      idx += 1;
      const appVersion = response.slice(idx, idx + appVersionLen).toString("ascii");

      idx += appVersionLen;
      const appFlagsLen = response[idx];

      idx += 1;
      const flagLen = appFlagsLen;
      const flagsValue = response[idx];

      return {
        returnCode: returnCode,
        errorMessage: errorCodeToString(returnCode),
        appName: appName,
        appVersion: appVersion,
        flagLen: flagLen,
        flagsValue: flagsValue,
        flagRecovery: (flagsValue & 1) !== 0,
        flagSignedMcuCode: (flagsValue & 2) !== 0,
        flagOnboarded: (flagsValue & 4) !== 0,
        flagPinValidated: (flagsValue & 128) !== 0,
      };
    }, IovLedgerApp.processErrorResponse);
  }
}
