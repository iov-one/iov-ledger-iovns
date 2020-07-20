import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import bech32 from "bech32";

import { IovLedgerApp, isIovLedgerAppAddress, isIovLedgerAppVersion } from "./ledgerapp";

const main = async (): Promise<void> => {
  const transport = await TransportNodeHid.create(1000);
  const app = new IovLedgerApp(transport);
  const version = await app.getVersion();
  if (!isIovLedgerAppVersion(version)) throw new Error(version.errorMessage);

  const response = await app.getAddress(0); // HARD-CODED
  if (!isIovLedgerAppAddress(response)) throw new Error(response.errorMessage);

  const words = bech32.toWords(Buffer.from(response.pubkey));

  // eslint-disable-next-line no-console
  console.log({
    address: response.address,
    errorMessage: response.errorMessage,
    pubkey: bech32.encode("starpub", words), // HARD-CODED
  });
};

main().catch(e => {
  console.error(e);
});
