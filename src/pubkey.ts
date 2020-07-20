import { Bech32 } from "@cosmjs/encoding";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

import { IovLedgerApp, isIovLedgerAppAddress, isIovLedgerAppVersion } from "./ledgerapp";

const main = async (): Promise<void> => {
  const transport = await TransportNodeHid.create(1000);
  const app = new IovLedgerApp(transport);
  const version = await app.getVersion();
  if (!isIovLedgerAppVersion(version)) throw new Error(version.errorMessage);

  const response = await app.getAddress(0); // HARD-CODED
  if (!isIovLedgerAppAddress(response)) throw new Error(response.errorMessage);

  // eslint-disable-next-line no-console
  console.log({
    address: response.address,
    errorMessage: response.errorMessage,
    pubkey: Bech32.encode("starpub", Buffer.from(response.pubkey)), // HARD-CODED
  });
};

main().catch(e => {
  console.error(e);
});
