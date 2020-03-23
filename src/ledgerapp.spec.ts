// eslint-disable-next-line simple-import-sort/sort
import "regenerator-runtime"; // required by @ledgerhq/hw-transport-node-hid

import { Ed25519, Sha512 } from "@iov/crypto";
import { Encoding, isUint8Array } from "@iov/encoding";
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
      expect(semver.satisfies(response.version, "^0.12.0")).toEqual(true);
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
      expect(response.pubkey).toEqual(
        fromHex("b0183e5a01425084175eaf18516786e627c4c0d883f84f0e98f3500b0b01e100"),
      );

      // Depending on the app version, we can get mainnet or testnet addresses
      if (version.testMode) {
        expect(response.address).toEqual("tiov1q7etanjstk2aj4u24wpw8l4s3agccdm2hsxdsl");
      } else {
        expect(response.address).toEqual("iov1q7etanjstk2aj4u24wpw8l4s3agccdm2e90fsw");
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

      // Dave's Nano S
      expect(response0.pubkey).toEqual(
        fromHex("1a212f01206bfeb41848fd0d2b722cc3301a47ad04a42b018323a860f5ea7705"),
      );
      expect(response1.pubkey).toEqual(
        fromHex("5025e4df716cf3be33ffe6b4a13c91d6ebad4dd5a5397c9c4364c5f48ac73678"),
      );
      expect(response2.pubkey).toEqual(
        fromHex("0a22dde037ffe39a33404d69c504aaf8daf47bf91966126b0af809f76fc67651"),
      );
      expect(response3.pubkey).toEqual(
        fromHex("e20030b60015caf713e215561a7428b6a35b6d86f06ef830f350bbc3525e533a"),
      );
      expect(response4.pubkey).toEqual(
        fromHex("fe289f8990e0dfe0a8ce8a503c7c93067438b8c7d951afb8db2483a8ef8b1f78"),
      );

      if (version.testMode) {
        expect(response0.address).toEqual("tiov1fpezwaxfnmef8tyyg4t7avz9a2d9gqh32zwf8z");
        expect(response1.address).toEqual("tiov1falpfyxkcpkkuf3txddrf5407yj9w4zfqh8wwl");
        expect(response2.address).toEqual("tiov1hkm5lrvnnp5xm8dd4x5ukzdeajmzmts3gvmguq");
        expect(response3.address).toEqual("tiov17tekp649jsksu28kcxxl22lrqpd83r5ludnd5t");
        expect(response4.address).toEqual("tiov1pe5fa7hy3s0803zl4jv7gwdj5h9mxx9hjug2gr");
      } else {
        expect(response0.address).toEqual("iov1fpezwaxfnmef8tyyg4t7avz9a2d9gqh3yh8d8n");
        expect(response1.address).toEqual("iov1falpfyxkcpkkuf3txddrf5407yj9w4zfwzw2ww");
        expect(response2.address).toEqual("iov1hkm5lrvnnp5xm8dd4x5ukzdeajmzmts3xejvu3");
        expect(response3.address).toEqual("iov17tekp649jsksu28kcxxl22lrqpd83r5ljc6f56");
        expect(response4.address).toEqual("iov1pe5fa7hy3s0803zl4jv7gwdj5h9mxx9hufpwgj");
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

      // Dave's Nano S
      expect(response.pubkey).toEqual(
        fromHex("b0183e5a01425084175eaf18516786e627c4c0d883f84f0e98f3500b0b01e100"),
      );

      // Depending on the app version, we can get mainnet or testnet addresses
      if (version.testMode) {
        expect(response.address).toEqual("tiov1q7etanjstk2aj4u24wpw8l4s3agccdm2hsxdsl");
      } else {
        expect(response.address).toEqual("iov1q7etanjstk2aj4u24wpw8l4s3agccdm2e90fsw");
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

        expect(isUint8Array(responseSign.signature)).toEqual(true);
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

        expect(isUint8Array(responseSign.signature)).toEqual(true);
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

        expect(isUint8Array(responseSign.signature)).toEqual(true);
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

        expect(isUint8Array(responseSign.signature)).toEqual(true);
        // Check signature is valid
        const prehash = new Sha512(txBlob).digest();
        const valid = await Ed25519.verifySignature(responseSign.signature, prehash, responseAddr.pubkey);
        expect(valid).toEqual(true);
      }
    }, 60_000);
  });
});
