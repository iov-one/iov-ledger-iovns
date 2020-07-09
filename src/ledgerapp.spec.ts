import { Secp256k1, Secp256k1Signature, Sha256 } from "@iov/crypto";
import { Encoding } from "@iov/encoding";
import Transport from "@ledgerhq/hw-transport";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import * as semver from "semver";

import {
  pendingWithoutInteractiveLedger,
  pendingWithoutLedger,
  pendingWithoutSeededLedger,
  skipTests,
} from "./common.spec";
import { IovLedgerApp, isIovLedgerAppAddress, isIovLedgerAppSignature, isIovLedgerAppVersion } from "./ledgerapp";

const { fromHex } = Encoding;

describe("IovLedgerApp", () => {
  // https://github.com/Zondax/ledger-cosmos-js/blob/master/tests/basic.ispec.js#L132
  const message = String.raw`{"account_number":"6571","chain_id":"iov-mainnet-2","fee":{"amount":[{"amount":"5000","denom":"uatom"}],"gas":"200000"},"memo":"Delegated with Ledger from union.market","msgs":[{"type":"cosmos-sdk/MsgDelegate","value":{"amount":{"amount":"1000000","denom":"uatom"},"delegator_address":"cosmos102hty0jv2s29lyc4u0tv97z9v298e24t3vwtpl","validator_address":"cosmosvaloper1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7"}}],"sequence":"0"}`;

  let transport: Transport | undefined;

  beforeAll(async () => {
    if (!skipTests()) {
      transport = await TransportNodeHid.create(1000);
    }
  });

  describe("serializeBIP32", () => {
    it("returns 5*4 bytes", () => {
      const serialization = IovLedgerApp.serializeBIP32(0);
      expect(serialization.length).toEqual(20);
    });

    it("returns correct components", () => {
      // Encoding is 5x uint32 as little endian
      expect(IovLedgerApp.serializeBIP32(0x00).toString("hex")).toEqual("2c000080ea000080000000800000000000000000");
      expect(IovLedgerApp.serializeBIP32(0x01).toString("hex")).toEqual("2c000080ea000080010000800000000000000000");
      expect(IovLedgerApp.serializeBIP32(0x02).toString("hex")).toEqual("2c000080ea000080020000800000000000000000");
      expect(IovLedgerApp.serializeBIP32(0x03).toString("hex")).toEqual("2c000080ea000080030000800000000000000000");
      expect(IovLedgerApp.serializeBIP32(0xff).toString("hex")).toEqual("2c000080ea000080ff0000800000000000000000");
      expect(IovLedgerApp.serializeBIP32(0xffeedd).toString("hex")).toEqual("2c000080ea000080ddeeff800000000000000000");
      expect(IovLedgerApp.serializeBIP32(2 ** 31 - 1).toString("hex")).toEqual("2c000080ea000080ffffffff0000000000000000");
    });

    it("throws for values out of range", () => {
      expect(() => IovLedgerApp.serializeBIP32(Number.NaN)).toThrowError(/Input must be an integer/);
      expect(() => IovLedgerApp.serializeBIP32(1.5)).toThrowError(/Input must be an integer/);
      expect(() => IovLedgerApp.serializeBIP32(Number.POSITIVE_INFINITY)).toThrowError(/Input must be an integer/);

      expect(() => IovLedgerApp.serializeBIP32(-1)).toThrowError(/is out of range/);
      expect(() => IovLedgerApp.serializeBIP32(2 ** 31)).toThrowError(/is out of range/);
    });
  });

  describe("getVersion", () => {
    it("works", async () => {
      pendingWithoutLedger();

      const app = new IovLedgerApp(transport!);
      const response = await app.getVersion();
      if (!isIovLedgerAppVersion(response)) throw new Error(response.errorMessage);
      expect(response).toEqual(
        jasmine.objectContaining({
          deviceLocked: false,
          errorMessage: "No errors",
        }),
      );
      expect(response.version).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
      expect(semver.satisfies(response.version, "^2.16.1")).toEqual(true);
    });
  });

  describe("getAddress", () => {
    it("can get address", async () => {
      pendingWithoutSeededLedger();

      const app = new IovLedgerApp(transport!);
      const version = await app.getVersion();
      if (!isIovLedgerAppVersion(version)) throw new Error(version.errorMessage);

      const response = await app.getAddress(5);
      if (!isIovLedgerAppAddress(response)) throw new Error(response.errorMessage);

      // Dave's Nano S
      expect(response.pubkey).toEqual(fromHex("02556ea856f4c9f5b46fa1b280b1d582001d7c5c334d0064bd077fe14f95b4746c"));
      expect(response.address).toEqual("star1mpkcl3y2wh22z5zx2ay0ptfa2gn44luvkhvam2");
    });

    it("can get multiple addresses", async () => {
      pendingWithoutSeededLedger();

      const app = new IovLedgerApp(transport!);
      const version = await app.getVersion();
      if (!isIovLedgerAppVersion(version)) throw new Error(version.errorMessage);

      const response0 = await app.getAddress(0);
      const response1 = await app.getAddress(1);
      const response2 = await app.getAddress(2);
      const response3 = await app.getAddress(3);
      const response4 = await app.getAddress(4);

      if (!isIovLedgerAppAddress(response0)) throw new Error(response0.errorMessage);
      if (!isIovLedgerAppAddress(response1)) throw new Error(response1.errorMessage);
      if (!isIovLedgerAppAddress(response2)) throw new Error(response2.errorMessage);
      if (!isIovLedgerAppAddress(response3)) throw new Error(response3.errorMessage);
      if (!isIovLedgerAppAddress(response4)) throw new Error(response4.errorMessage);

      // Dave's Nano S
      expect(response0.pubkey).toEqual(fromHex("03910af2b917aa3f3d47cbd5acd00515c4254942bd6d288f6c143c58b59c754125"));
      expect(response1.pubkey).toEqual(fromHex("0336336953bbb361d2d637e16c73b91b1dc9e4c563edf8a6b1aa7f8375ab21b3e1"));
      expect(response2.pubkey).toEqual(fromHex("02dbd141ed142bd08e3559b9b52b1f1469e07ec6c9e65ed4adf1ffb361ccc4f0c4"));
      expect(response3.pubkey).toEqual(fromHex("025e04ceace051f05ca1bd4b03b635618b64eaa86da9c54227181322ec25bdd4d9"));
      expect(response4.pubkey).toEqual(fromHex("023f2c2ca47ad9dcbd6bd42a2925f2f33cc21c7429db3c8e3c7787a4c47eaf325d"));

      expect(response0.address).toEqual("star1y4t33z7ugz2323vnuhjwftz33quns0t4znr7ps");
      expect(response1.address).toEqual("star1uqz39p6jwacjqzuwwgatvnwp8avy77s0r0vh0m");
      expect(response2.address).toEqual("star1n5klcw8setnrjdh0853gg53jwpenmuxarxxhhk");
      expect(response3.address).toEqual("star1rs9xy4uxkhev0s4e2lt8f5uskamunuzkrxmguz");
      expect(response4.address).toEqual("star1funq4jywn4m24clqvnx8ylxpm05wkyd9ch74rh");
    });

    it("can show and get address", async () => {
      pendingWithoutSeededLedger();
      pendingWithoutInteractiveLedger();

      const app = new IovLedgerApp(transport!);
      const version = await app.getVersion();
      if (!isIovLedgerAppVersion(version)) throw new Error(version.errorMessage);

      const response = await app.getAddress(5, true);
      if (!isIovLedgerAppAddress(response)) throw new Error(response.errorMessage);

      // Dave's Nano S
      expect(response.pubkey).toEqual(fromHex("02556ea856f4c9f5b46fa1b280b1d582001d7c5c334d0064bd077fe14f95b4746c"));
      expect(response.address).toEqual("star1mpkcl3y2wh22z5zx2ay0ptfa2gn44luvkhvam2");
    });
  });

  describe("sign", () => {
    it("can sign", async () => {
      pendingWithoutSeededLedger();
      pendingWithoutInteractiveLedger();

      const app = new IovLedgerApp(transport!);
      const version = await app.getVersion();
      if (!isIovLedgerAppVersion(version)) throw new Error(version.errorMessage);

      const accountIndex = 0;
      const responseAddr = await app.getAddress(accountIndex);
      if (!isIovLedgerAppAddress(responseAddr)) throw new Error(responseAddr.errorMessage);

      const responseSign = await app.sign(accountIndex, message);
      if (!isIovLedgerAppSignature(responseSign)) throw new Error(responseSign.errorMessage);

      expect(responseSign.signature instanceof Secp256k1Signature).toEqual(true);

      // Check signature is valid
      const encoded = Uint8Array.from(message.split(""), s => s.charCodeAt(0));
      const prehash = new Sha256(encoded).digest();
      const valid = await Secp256k1.verifySignature(responseSign.signature, prehash, responseAddr.pubkey);

      expect(valid).toEqual(true);
    });
  });
});
