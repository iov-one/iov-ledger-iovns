/// <reference types="node" />
/// <reference types="ledgerhq__hw-transport" />
import Transport from "@ledgerhq/hw-transport";
export interface IovLedgerAppErrorState {
    readonly returnCode: number;
    readonly errorMessage: string;
}
export interface IovLedgerAppVersion extends IovLedgerAppErrorState {
    readonly testMode: boolean;
    readonly version: string;
    readonly deviceLocked: boolean;
}
export declare function isIovLedgerAppVersion(data: IovLedgerAppVersion | IovLedgerAppErrorState): data is IovLedgerAppVersion;
export interface IovLedgerAppAddress extends IovLedgerAppErrorState {
    readonly pubkey: Uint8Array;
    readonly address: string;
}
export declare function isIovLedgerAppAddress(data: IovLedgerAppAddress | IovLedgerAppErrorState): data is IovLedgerAppAddress;
export interface IovLedgerAppSignature extends IovLedgerAppErrorState {
    readonly signature: Uint8Array;
}
export declare function isIovLedgerAppSignature(data: IovLedgerAppSignature | IovLedgerAppErrorState): data is IovLedgerAppSignature;
export declare class IovLedgerApp {
    static serializeBIP32(accountIndex: number): Buffer;
    static signGetChunks(addressIndex: number, message: Uint8Array): readonly Buffer[];
    private static processErrorResponse;
    private readonly transport;
    constructor(transport: Transport);
    getVersion(): Promise<IovLedgerAppVersion | IovLedgerAppErrorState>;
    getAddress(addressIndex: number, requireConfirmation?: boolean): Promise<IovLedgerAppAddress | IovLedgerAppErrorState>;
    sign(addressIndex: number, message: Uint8Array): Promise<IovLedgerAppSignature | IovLedgerAppErrorState>;
    private signSendChunk;
}
