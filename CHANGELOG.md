# Changelog

## 2.1.0
- Add iovLedgerApp.GetAppInfo()
- Add targetId to return value from iovLedgerApp.getVersion()

Breaking Changes:
- Revert to DER signature in iovLedgerApp.sign()

## 2.0.1
- Convert signature from DER in iovLedgerApp.sign()
- Allow a transaction-like object to be passed to iovLedgerApp.sign()
  - Ledger app expects `msgs` but the chain expects `msg` in the tx object
- Allow optional human readable part (HRP) arg to iovLedgerApp.constructor()

## 2.0.0

Breaking changes:
- Sign a String instead of a Uint8Array
- Use Secp256k1 instead of Ed25519

## 1.0.0

Breaking changes:
- Use Ledger firmware 1.6.0

## 0.14.2

- Ensure signatures are Uint8Array not Buffers at runtime

## 0.14.1

- Use `@ledgerhq/hw-transport` types from Definitely Typed
- Add multisig tests (min app version for tests is now 0.10.0)

## 0.14.0

Breaking changes:

- Give up the idea of managing `Transport`s internally. The transport handling
  is too environment-specific and should be done by the caller. This also removes
  the Wallet implementation for Ledger, which does not have an interface to inject
  a transport. If that is needed at some point in the future, check the v0.13.0 tag.
- Prefix all types with `IovLedgerApp` consistently
- Convert `IovLedgerApp.major`, `.minor`, `.patch` to `.version` string that
  can be checked using semver.
