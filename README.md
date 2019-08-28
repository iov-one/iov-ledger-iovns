# @iov/ledger-bns

[![npm version](https://img.shields.io/npm/v/@iov/ledger-bns.svg)](https://www.npmjs.com/package/@iov/ledger-bns)

This package provides an adaptor to use the bns ledger app as a wallet.
The app is still in dev mode and not available in the ledger store, so
this is really for cutting edge devs now.

It should also demonstrate how to implement an additional Wallet outside of @iov/keycontrol
that can be dynamically loaded by any app in initialization.

## Getting started

Create a LedgerSimpleAddressWallet for signing with a Ledger. All
further functionality is provided by the `UserProfile`.

```ts
import { UserProfile } from "@iov/core";
import { LedgerSimpleAddressWallet } from "@iov/ledger-bns";

const profile = new UserProfile();
profile.addWallet(new LedgerSimpleAddressWallet());
```

The @iov/cli [provides further examples](https://github.com/iov-one/iov-core/tree/master/packages/iov-cli#ledger-usage)
of how to use this wallet.

## Internal interfaces

Those interfaces are for maintainers of the package only and are not exposed
outside of @iov/ledger-bns.

If you want to call the Ledger directly, you will need to
[connectToFirstLedger](https://iov-one.github.io/iov-core-docs/latest/iov-ledger-bns/globals.html#connecttofirstledger) to get a transport,
which you can [getPublicKeyWithIndex](https://iov-one.github.io/iov-core-docs/latest/iov-ledger-bns/globals.html#getpublickeywithindex)
or [signTransactionWithIndex](https://iov-one.github.io/iov-core-docs/latest/iov-ledger-bns/globals.html#signtransactionwithindex).

You can also try `yarn checkapp` to see events as you change apps on the Ledger,
which should detect when the proper app is opened and when you leave the app.

To run this code (or even `yarn test`), you must have the bns Ledger app
installed and open and connected to the computer running tests.
The tests will prompt you to confirm transactions as well, so when the tests
freeze, go hit those buttons on the Ledger.

## Compatibility

The code is compatible with https://github.com/iov-one/ledger-bns v0.1.0.
In particular, it works with the app installed from `mvp1/samecrypto`.
Please follow the README there and install properly before running this code.
And make sure the versions match.

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
