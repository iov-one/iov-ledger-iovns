/*
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

const CLA = 0x22;
const CHUNK_SIZE = 250;
const APP_KEY = "IOV";

const IOV_COIN_TYPE = 234;

const INS = {
  GET_VERSION: 0x00,
  GET_ADDR_ED25519: 0x01,
  SIGN_ED25519: 0x02,
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
}

export function isIovLedgerAppVersion(
  data: IovLedgerAppVersion | IovLedgerAppErrorState,
): data is IovLedgerAppVersion {
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

export function isIovLedgerAppAddress(
  data: IovLedgerAppAddress | IovLedgerAppErrorState,
): data is IovLedgerAppAddress {
  return typeof (data as IovLedgerAppAddress).address !== "undefined";
}

export interface IovLedgerAppSignature extends IovLedgerAppErrorState {
  readonly signature: Uint8Array;
}

export function isIovLedgerAppSignature(
  data: IovLedgerAppSignature | IovLedgerAppErrorState,
): data is IovLedgerAppSignature {
  return typeof (data as IovLedgerAppSignature).signature !== "undefined";
}

export class IovLedgerApp {
  public static serializeBIP32(accountIndex: number): Buffer {
    if (!Number.isInteger(accountIndex)) throw new Error("Input must be an integer");
    if (accountIndex < 0 || accountIndex > 2 ** 31 - 1) throw new Error("Index is out of range");

    const buf = Buffer.alloc(12);
    buf.writeUInt32LE(harden(44), 0);
    buf.writeUInt32LE(harden(IOV_COIN_TYPE), 4);
    buf.writeUInt32LE(harden(accountIndex), 8);
    return buf;
  }

  public static signGetChunks(addressIndex: number, message: Uint8Array): readonly Buffer[] {
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

  constructor(transport: Transport) {
    if (!transport) {
      throw new Error("Transport has not been defined");
    }

    this.transport = transport;
    this.transport.decorateAppAPIMethods(this, ["getVersion", "getAddress", "sign"], APP_KEY);
  }

  public async getVersion(): Promise<IovLedgerAppVersion | IovLedgerAppErrorState> {
    return this.transport.send(CLA, INS.GET_VERSION, 0, 0).then(response => {
      if (response.length < 6) throw new Error(`Response data too short: ${response}`);

      const errorCodeData = response.slice(-2);
      const errorCode = errorCodeData[0] * 256 + errorCodeData[1];

      const success: IovLedgerAppVersion = {
        testMode: response[0] !== 0,
        version: `${response[1]}.${response[2]}.${response[3]}`,
        deviceLocked: response[4] === 1,
        returnCode: errorCode,
        errorMessage: errorCodeToString(errorCode),
      };
      return success;
    }, IovLedgerApp.processErrorResponse);
  }

  public async getAddress(
    addressIndex: number,
    requireConfirmation = false,
  ): Promise<IovLedgerAppAddress | IovLedgerAppErrorState> {
    const bip32Path = IovLedgerApp.serializeBIP32(addressIndex);

    let p1 = 0;
    if (requireConfirmation) p1 = 1;

    return this.transport.send(CLA, INS.GET_ADDR_ED25519, p1, 0, bip32Path).then(response => {
      const errorCodeData = response.slice(-2);
      const errorCode = errorCodeData[0] * 256 + errorCodeData[1];
      const success: IovLedgerAppAddress = {
        pubkey: new Uint8Array([...response.slice(0, 32)]),
        address: response.slice(32, response.length - 2).toString("ascii"),
        returnCode: errorCode,
        errorMessage: errorCodeToString(errorCode),
      };
      return success;
    }, IovLedgerApp.processErrorResponse);
  }

  public async sign(
    addressIndex: number,
    message: Uint8Array,
  ): Promise<IovLedgerAppSignature | IovLedgerAppErrorState> {
    const chunks = IovLedgerApp.signGetChunks(addressIndex, message);
    return this.signSendChunk(1, chunks.length, chunks[0]).then(async result => {
      let latestResult = result;
      for (let i = 1; i < chunks.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop,no-param-reassign
        latestResult = await this.signSendChunk(1 + i, chunks.length, chunks[i]);
        if (result.returnCode !== 0x9000) {
          break;
        }
      }

      return latestResult;
    }, IovLedgerApp.processErrorResponse);
  }

  private async signSendChunk(
    chunkIdx: number,
    chunkNum: number,
    chunk: Buffer,
  ): Promise<IovLedgerAppSignature | IovLedgerAppErrorState> {
    return this.transport
      .send(CLA, INS.SIGN_ED25519, chunkIdx, chunkNum, chunk, [0x9000, 0x6a80])
      .then(response => {
        if (response.length < 2) {
          throw new Error("Response too short to cut status code");
        }

        const errorCodeData = response.slice(-2);
        const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
        let errorMessage = errorCodeToString(returnCode);

        let signature = new Uint8Array();
        if (returnCode === 0x6a80) {
          errorMessage = response.slice(0, response.length - 2).toString("ascii");
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
}
