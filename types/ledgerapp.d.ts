/// <reference types="node" />
/// <reference types="ledgerhq__hw-transport" />
import { Transport } from "@ledgerhq/hw-transport";
export interface LedgerAppErrorState {
    readonly returnCode: number;
    readonly errorMessage: string;
}
export interface LedgerAppVersion extends LedgerAppErrorState {
    readonly testMode: boolean;
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
    readonly deviceLocked: boolean;
}
export declare function isLedgerAppVersion(data: LedgerAppVersion | LedgerAppErrorState): data is LedgerAppVersion;
export interface LedgerAppAddress extends LedgerAppErrorState {
    readonly pubkey: Uint8Array;
    readonly address: string;
}
export declare function isLedgerAppAddress(data: LedgerAppAddress | LedgerAppErrorState): data is LedgerAppAddress;
export interface LedgerAppSignature extends LedgerAppErrorState {
    readonly signature: Uint8Array;
}
export declare function isLedgerAppSignature(data: LedgerAppSignature | LedgerAppErrorState): data is LedgerAppSignature;
export declare class LedgerApp {
    static serializeBIP32(accountIndex: number): Buffer;
    static signGetChunks(addressIndex: number, message: Uint8Array): readonly Buffer[];
    private static processErrorResponse;
    private readonly transport;
    constructor(transport: Transport);
    getVersion(): Promise<LedgerAppVersion | LedgerAppErrorState>;
    getAddress(addressIndex: number, requireConfirmation?: boolean): Promise<LedgerAppAddress | LedgerAppErrorState>;
    sign(addressIndex: number, message: Uint8Array): Promise<LedgerAppSignature | LedgerAppErrorState>;
    private signSendChunk;
}
