import { Bip39, Ed25519, EnglishMnemonic, Slip10, Slip10Curve, Slip10RawIndex } from "@iov/crypto";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

import { getPublicKeyWithIndex } from "./app";
import { pendingWithoutSeededLedger, skipSeededTests } from "./common.spec";
import { connectToFirstLedger } from "./exchange";

describe("Check key derivation", () => {
  let transport: TransportNodeHid | undefined;

  // try 12 word seed phrase to enter in ledger for these tests
  // you have to reinit the ledger for this to work
  const phrase = "tell fresh liquid vital machine rhythm uncle tomato grow room vacuum neutral";

  const mneumonic = new EnglishMnemonic(phrase);
  const purpose = Slip10RawIndex.hardened(4804438); // from ed25519simpleaddress

  beforeAll(async () => {
    if (!skipSeededTests()) {
      transport = await connectToFirstLedger();
    }
  });

  it("compare public keys", async () => {
    pendingWithoutSeededLedger();

    const checkKey = async (i: number): Promise<void> => {
      const hdPath: ReadonlyArray<Slip10RawIndex> = [purpose, Slip10RawIndex.hardened(i)];
      const seed = await Bip39.mnemonicToSeed(mneumonic);
      const res = Slip10.derivePath(Slip10Curve.Ed25519, seed, hdPath);

      const keypair = await Ed25519.makeKeypair(res.privkey);
      const swPubkey = keypair.pubkey;
      expect(swPubkey).toBeTruthy();
      expect(swPubkey.length).toEqual(32);

      const hwPubkey = await getPublicKeyWithIndex(transport!, i);
      expect(hwPubkey).toBeTruthy();
      expect(hwPubkey.length).toEqual(32);

      expect(new Uint8Array(hwPubkey)).toEqual(swPubkey);
    };

    await Promise.all([3, 0, 17, 1346, 123456, 53252985].map(checkKey));
  });
});
