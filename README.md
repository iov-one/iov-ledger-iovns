# @iov/ledger-bns

[![npm version](https://img.shields.io/npm/v/@iov/ledger-bns.svg)](https://www.npmjs.com/package/@iov/ledger-bns)

This package provides an adaptor to use the bns ledger app as a wallet.
The app is still in dev mode and not available in the ledger store, so
this is really for cutting edge devs now.

It should also demonstrate how to implement an additional Wallet outside of @iov/keycontrol
that can be dynamically loaded by any app in initialization.

## Getting started

Create a wallet for signing with a Ledger.
All further functionality is provided by the `UserProfile`.

```ts
import { UserProfile } from "@iov/core";
import { IovLedgerWallet } from "@iov/ledger-bns";

const profile = new UserProfile();
profile.addWallet(new IovLedgerWallet());
```

## API Documentation

Docs are not published at the moment. To generate them locally run

```
$ yarn install
$ yarn docs
```

and check the `./docs` folder.

## License

Copyright 2018-2019 IOV SAS

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
