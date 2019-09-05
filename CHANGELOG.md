# Changelog

## 0.15.0

Breaking changes:

- Give up the idea of managing `Transport`s internally. The transport handling
  is too environment-specific and should be done by the caller. This also removes
  the Wallet implementation for Ledger, which does not have an interface to inject
  a transport. If that is needed at some point in the future, check the v0.14.0 tag.
- Prefix all types with `IovLedgerApp` consistently

## 0.14.0

Breaking changes:

- Convert `LedgerAppVersion.major`, `.minor`, `.patch` to `.version` string that
  can be checked using semver.
