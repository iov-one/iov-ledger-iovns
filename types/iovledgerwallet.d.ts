import "babel-polyfill";
import { ChainId, Identity, PrehashType, SignableBytes, SignatureBytes } from "@iov/bcp";
import { Ed25519Keypair, Slip10RawIndex } from "@iov/crypto";
import { Wallet, WalletId, WalletImplementationIdString, WalletSerializationString } from "@iov/keycontrol";
import { ValueAndUpdates } from "@iov/stream";
export declare class IovLedgerWallet implements Wallet {
    static readonly implementationId: WalletImplementationIdString;
    /**
     * A convenience function to register this wallet type with the global Keyring class
     */
    static registerWithKeyring(): void;
    private static readonly idPool;
    private static readonly idsPrng;
    private static generateId;
    private static identityId;
    private static buildIdentity;
    readonly id: WalletId;
    readonly label: ValueAndUpdates<string | undefined>;
    readonly canSign: ValueAndUpdates<boolean>;
    readonly implementationId: WalletImplementationIdString;
    private readonly labelProducer;
    private readonly identities;
    private readonly labels;
    private readonly accountIndices;
    constructor(data?: WalletSerializationString);
    setLabel(label: string | undefined): void;
    createIdentity(chainId: ChainId, options: unknown): Promise<Identity>;
    setIdentityLabel(identity: Identity, label: string | undefined): void;
    getIdentityLabel(identity: Identity): string | undefined;
    getIdentities(): ReadonlyArray<Identity>;
    createTransactionSignature(identity: Identity, transactionBytes: SignableBytes, prehashType: PrehashType): Promise<SignatureBytes>;
    printableSecret(): string;
    serialize(): WalletSerializationString;
    clone(): Wallet;
    previewIdentity(chainId: ChainId, options: Ed25519Keypair | ReadonlyArray<Slip10RawIndex> | number): Promise<Identity>;
    private getAccountIndex;
}
