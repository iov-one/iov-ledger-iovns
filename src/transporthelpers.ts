import { Transport } from "@ledgerhq/hw-transport";

function environmentIsNodeJs(): boolean {
  return (
    typeof process !== "undefined" &&
    typeof process.versions !== "undefined" &&
    typeof process.versions.node !== "undefined"
  );
}

export class TransportHelpers {
  public static async createTransport(): Promise<Transport> {
    if (environmentIsNodeJs()) {
      // This module must be imported dynamically in order to allow using @iov/ledger-bns in the browser
      // tslint:disable-next-line: variable-name
      const TransportNodeHid = (await import("@ledgerhq/hw-transport-node-hid")).default;
      return TransportNodeHid.create(1000);
    } else {
      throw new Error("No transport available for this environment");
    }
  }
}
