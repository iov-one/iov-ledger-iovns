import { Transport } from "@ledgerhq/hw-transport";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

function environmentIsNodeJs(): boolean {
  return (
    typeof process !== "undefined" &&
    typeof process.versions !== "undefined" &&
    typeof process.versions.node !== "undefined"
  );
}

export class Communication {
  public static async createTransport(): Promise<Transport> {
    if (environmentIsNodeJs()) {
      return TransportNodeHid.create(1000);
    } else {
      throw new Error("No transport available for this environment");
    }
  }
}
