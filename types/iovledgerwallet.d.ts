import { ChainId, Identity, PrehashType, SignableBytes, SignatureBytes } from "@iov/bcp";
import { Ed25519Keypair, Slip10RawIndex } from "@iov/crypto";
import { Wallet, WalletId, WalletImplementationIdString, WalletSerializationString } from "@iov/keycontrol";
import { ValueAndUpdates } from "@iov/stream";
import { LedgerState } from "./statetracker";
export declare class LedgerSimpleAddressWallet implements Wallet {
    static readonly implementationId: WalletImplementationIdString;
    /**
     * A convenience function to register this wallet type with the global Keyring class
     */
    static registerWithKeyring(): void;
    private static readonly idPool;
    private static readonly idsPrng;
    private static generateId;
    private static identityId;
    readonly id: WalletId;
    readonly label: ValueAndUpdates<string | undefined>;
    readonly canSign: ValueAndUpdates<boolean>;
    readonly implementationId: WalletImplementationIdString;
    readonly deviceState: ValueAndUpdates<LedgerState>;
    private readonly deviceTracker;
    private readonly labelProducer;
    private readonly canSignProducer;
    private readonly identities;
    private readonly labels;
    private readonly simpleAddressIndices;
    constructor(data?: WalletSerializationString);
    /**
     * Turn on tracking USB devices.
     *
     * This is must be called before every hardware interaction,
     * i.e. createIdentity() and createTransactionSignature() and to
     * use the canSign and deviceState properties.
     */
    startDeviceTracking(): void;
    /**
     * Turn off tracking USB devices.
     *
     * Use this to save resources when LedgerSimpleAddressWallet is not used anymore.
     * With device tracking turned off, canSign and deviceState are not updated anymore.
     */
    stopDeviceTracking(): void;
    setLabel(label: string | undefined): void;
    createIdentity(chainId: ChainId, options: unknown): Promise<Identity>;
    setIdentityLabel(identity: Identity, label: string | undefined): void;
    getIdentityLabel(identity: Identity): string | undefined;
    getIdentities(): ReadonlyArray<Identity>;
    createTransactionSignature(identity: Identity, transactionBytes: SignableBytes, prehashType: PrehashType): Promise<SignatureBytes>;
    printableSecret(): string;
    serialize(): WalletSerializationString;
    clone(): Wallet;
    previewIdentity(_chainId: ChainId, _options: Ed25519Keypair | ReadonlyArray<Slip10RawIndex> | number): Promise<Identity>;
    private simpleAddressIndex;
    private buildIdentity;
}
