import "regenerator-runtime"; // required by @ledgerhq/hw-transport-node-hid

import { Ed25519, Sha512 } from "@iov/crypto";
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
import {
  IovLedgerApp,
  isIovLedgerAppAddress,
  isIovLedgerAppSignature,
  isIovLedgerAppVersion,
} from "./ledgerapp";

const { fromHex } = Encoding;

describe("IovLedgerApp", () => {
  let transport: Transport | undefined;

  beforeAll(async () => {
    if (!skipTests()) {
      transport = await TransportNodeHid.create(1000);
    }
  });

  describe("serializeBIP32", () => {
    it("returns 3*4 bytes", () => {
      const serialization = IovLedgerApp.serializeBIP32(0);
      expect(serialization.length).toEqual(12);
    });

    it("returns correct components", () => {
      // Encoding is 3x uint32 as little endian
      expect(IovLedgerApp.serializeBIP32(0x00).toString("hex")).toEqual("2c000080ea00008000000080");
      expect(IovLedgerApp.serializeBIP32(0x01).toString("hex")).toEqual("2c000080ea00008001000080");
      expect(IovLedgerApp.serializeBIP32(0x02).toString("hex")).toEqual("2c000080ea00008002000080");
      expect(IovLedgerApp.serializeBIP32(0x03).toString("hex")).toEqual("2c000080ea00008003000080");
      expect(IovLedgerApp.serializeBIP32(0xff).toString("hex")).toEqual("2c000080ea000080ff000080");
      expect(IovLedgerApp.serializeBIP32(0xffeedd).toString("hex")).toEqual("2c000080ea000080ddeeff80");
      expect(IovLedgerApp.serializeBIP32(2 ** 31 - 1).toString("hex")).toEqual("2c000080ea000080ffffffff");
    });

    it("throws for values out of range", () => {
      expect(() => IovLedgerApp.serializeBIP32(Number.NaN)).toThrowError(/Input must be an integer/);
      expect(() => IovLedgerApp.serializeBIP32(1.5)).toThrowError(/Input must be an integer/);
      expect(() => IovLedgerApp.serializeBIP32(Number.POSITIVE_INFINITY)).toThrowError(
        /Input must be an integer/,
      );

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
      expect(semver.satisfies(response.version, "^0.10.0")).toEqual(true);
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

      expect(response.pubkey).toEqual(
        fromHex("05173bf18e8bc4203176be82c89ca9519100fe2cf340cbad239750bd3e3ff668"),
      );

      // Depending on the app version, we can get mainnet or testnet addresses
      if (version.testMode) {
        expect(response.address).toEqual("tiov1k9rxcg8htk6wcq546p86ksgqhq8fza7hykl8mp");
      } else {
        expect(response.address).toEqual("iov1k9rxcg8htk6wcq546p86ksgqhq8fza7h2rkrms");
      }
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

      // Calculated using Token Finder tool with mnemonic
      // equip will roof matter pink blind book anxiety banner elbow sun young
      expect(response0.pubkey).toEqual(
        fromHex("5fe68efa9e7e6373a51f6e519b4ffc7d6330c6cd011d00f6a9663ca82c361bff"),
      );
      expect(response1.pubkey).toEqual(
        fromHex("385fe5a946e46727297cf7ad0bff7efa637e1c7516ea2fd9f6dc717404494455"),
      );
      expect(response2.pubkey).toEqual(
        fromHex("c8dca85dd7f1c4f231e46d579199b310975379c37445c664d1be824f088dbe07"),
      );
      expect(response3.pubkey).toEqual(
        fromHex("5ad1501134fb4ba2f5b1d7c8ca539152d7c31f07a301f6192bb757b3dab52a88"),
      );
      expect(response4.pubkey).toEqual(
        fromHex("f10ea4323ac84582370321208c71ca77700c85a099991aefc153bc5284c9c025"),
      );

      if (version.testMode) {
        expect(response0.address).toEqual("tiov1l678408y7a64cj66s8j64fevmspyfxdmv38cxw");
        expect(response1.address).toEqual("tiov1u42wk6lk009ex9t87gt54sn24m2psl4axfrd28");
        expect(response2.address).toEqual("tiov1lxry06n8l760mkthg7sgda48cne4t26llzwntz");
        expect(response3.address).toEqual("tiov10ur3vxhy00el95g5fqthe889z6lzqgr0f63tnl");
        expect(response4.address).toEqual("tiov12evzw2nds3qzfdrlnka5hx25azaarh3qypr6uv");
      } else {
        expect(response0.address).toEqual("iov1l678408y7a64cj66s8j64fevmspyfxdmzywuxl");
        expect(response1.address).toEqual("iov1u42wk6lk009ex9t87gt54sn24m2psl4agu2f2k");
        expect(response2.address).toEqual("iov1lxry06n8l760mkthg7sgda48cne4t26l3h8htn");
        expect(response3.address).toEqual("iov10ur3vxhy00el95g5fqthe889z6lzqgr080c0nw");
        expect(response4.address).toEqual("iov12evzw2nds3qzfdrlnka5hx25azaarh3q2527ua");
      }
    });

    it("can show and get address", async () => {
      pendingWithoutSeededLedger();
      pendingWithoutInteractiveLedger();

      const app = new IovLedgerApp(transport!);
      const version = await app.getVersion();
      if (!isIovLedgerAppVersion(version)) throw new Error(version.errorMessage);

      const response = await app.getAddress(5, true);
      if (!isIovLedgerAppAddress(response)) throw new Error(response.errorMessage);

      expect(response.pubkey).toEqual(
        fromHex("05173bf18e8bc4203176be82c89ca9519100fe2cf340cbad239750bd3e3ff668"),
      );

      // Depending on the app version, we can get mainnet or testnet addresses
      if (version.testMode) {
        expect(response.address).toEqual("tiov1k9rxcg8htk6wcq546p86ksgqhq8fza7hykl8mp");
      } else {
        expect(response.address).toEqual("iov1k9rxcg8htk6wcq546p86ksgqhq8fza7h2rkrms");
      }
    });
  });

  describe("sign", () => {
    it("can sign for testnet", async () => {
      pendingWithoutSeededLedger();
      pendingWithoutInteractiveLedger();

      const txBlob = fromHex(
        "00cafe000b696f762d6c6f76656e657400000000000000009a03380a020801121473f16e71d0878f6ad26531e174452aec9161e8d41a14000000000000000000000000000000000000000022061a0443415348",
      );

      const app = new IovLedgerApp(transport!);
      const version = await app.getVersion();
      if (!isIovLedgerAppVersion(version)) throw new Error(version.errorMessage);

      const accountIndex = 0;

      const responseAddr = await app.getAddress(accountIndex);
      if (!isIovLedgerAppAddress(responseAddr)) throw new Error(responseAddr.errorMessage);

      const responseSign = await app.sign(accountIndex, txBlob);

      if (version.testMode) {
        if (!isIovLedgerAppSignature(responseSign)) throw new Error(responseSign.errorMessage);

        // Check signature is valid
        const prehash = new Sha512(txBlob).digest();
        const valid = await Ed25519.verifySignature(responseSign.signature, prehash, responseAddr.pubkey);
        expect(valid).toEqual(true);
      } else {
        expect(responseSign.returnCode).toEqual(0x6984);
        expect(responseSign.errorMessage).toEqual("Data is invalid");
      }
    });

    it("can sign for mainnet", async () => {
      pendingWithoutSeededLedger();
      pendingWithoutInteractiveLedger();

      const txBlob = fromHex(
        "00cafe000b696f762d6d61696e6e6574001fffffffffffff0a231214bad055e2cbcffc633e7dc76dc1148d6e9a2debfd1a0b1080c2d72f1a04434153489a03560a0208011214bad055e2cbcffc633e7dc76dc1148d6e9a2debfd1a14020daec62066ec82a5a1b40378d87457ed88e4fc220d0807108088debe011a03494f562a1574657874207769746820656d6f6a693a20f09f908e",
      );

      const app = new IovLedgerApp(transport!);
      const version = await app.getVersion();
      if (!isIovLedgerAppVersion(version)) throw new Error(version.errorMessage);

      const accountIndex = 0;

      const responseAddr = await app.getAddress(accountIndex);
      if (!isIovLedgerAppAddress(responseAddr)) throw new Error(responseAddr.errorMessage);

      const responseSign = await app.sign(accountIndex, txBlob);

      if (version.testMode) {
        expect(responseSign.returnCode).toEqual(0x6984);
        expect(responseSign.errorMessage).toEqual("Data is invalid");
      } else {
        if (!isIovLedgerAppSignature(responseSign)) throw new Error(responseSign.errorMessage);

        // Check signature is valid
        const prehash = new Sha512(txBlob).digest();
        const valid = await Ed25519.verifySignature(responseSign.signature, prehash, responseAddr.pubkey);
        expect(valid).toEqual(true);
      }
    });

    it("can sign multisig for testnet", async () => {
      pendingWithoutSeededLedger();
      pendingWithoutInteractiveLedger();

      const txBlob = fromHex(
        "00cafe000b696f762d6c6f76656e657400000000000000070a231214b9edb87a87c93f6997aee7f8b599cf60f6165fc81a0b1080c2d72f1a04434153482208000000000000002a9a03c2010a0208011214abababab111222111222111222ccccccccdddddd1a140000000000000000000000000000000000000000220d08081080d293ad031a03494f562a8001412076657279206c6f6e67206d656d6f206c6f72656d20697073756d206c6f72656d20697073756d2e20412076657279206c6f6e67206d656d6f206c6f72656d20697073756d206c6f72656d20697073756d2e20412076657279206c6f6e67206d656d6f206c6f72656d20697073756d206c6f72656d20697073756d21213131",
      );

      const app = new IovLedgerApp(transport!);
      const version = await app.getVersion();
      if (!isIovLedgerAppVersion(version)) throw new Error(version.errorMessage);

      const accountIndex = 0;

      const responseAddr = await app.getAddress(accountIndex);
      if (!isIovLedgerAppAddress(responseAddr)) throw new Error(responseAddr.errorMessage);

      const responseSign = await app.sign(accountIndex, txBlob);

      if (version.testMode) {
        if (!isIovLedgerAppSignature(responseSign)) throw new Error(responseSign.errorMessage);

        // Check signature is valid
        const prehash = new Sha512(txBlob).digest();
        const valid = await Ed25519.verifySignature(responseSign.signature, prehash, responseAddr.pubkey);
        expect(valid).toEqual(true);
      } else {
        expect(responseSign.returnCode).toEqual(0x6984);
        expect(responseSign.errorMessage).toEqual("Data is invalid");
      }
    }, 60_000);

    it("can sign multisig for mainnet", async () => {
      pendingWithoutSeededLedger();
      pendingWithoutInteractiveLedger();

      const txBlob = fromHex(
        "00cafe000b696f762d6d61696e6e657400000000000000070a2312145ae2c58796b0ad48ffe7602eac3353488c859a2b1a0b1080c2d72f1a0443415348220800000000000000012208000000000000007b220800000000000001c722080000000000000b3d9a03c2010a02080112148787878787878787aaaaaaaaaaaaaaaa999999991a14020daec62066ec82a5a1b40378d87457ed88e4fc220d08081080d293ad031a03494f562a8001412076657279206c6f6e67206d656d6f206c6f72656d20697073756d206c6f72656d20697073756d2e20412076657279206c6f6e67206d656d6f206c6f72656d20697073756d206c6f72656d20697073756d2e20412076657279206c6f6e67206d656d6f206c6f72656d20697073756d206c6f72656d20697073756d21213131",
      );

      const app = new IovLedgerApp(transport!);
      const version = await app.getVersion();
      if (!isIovLedgerAppVersion(version)) throw new Error(version.errorMessage);

      const accountIndex = 0;

      const responseAddr = await app.getAddress(accountIndex);
      if (!isIovLedgerAppAddress(responseAddr)) throw new Error(responseAddr.errorMessage);

      const responseSign = await app.sign(accountIndex, txBlob);

      if (version.testMode) {
        expect(responseSign.returnCode).toEqual(0x6984);
        expect(responseSign.errorMessage).toEqual("Data is invalid");
      } else {
        if (!isIovLedgerAppSignature(responseSign)) throw new Error(responseSign.errorMessage);

        // Check signature is valid
        const prehash = new Sha512(txBlob).digest();
        const valid = await Ed25519.verifySignature(responseSign.signature, prehash, responseAddr.pubkey);
        expect(valid).toEqual(true);
      }
    }, 60_000);
  });
});
