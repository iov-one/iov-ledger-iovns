/// <reference types="ledgerhq__hw-transport" />
import { Transport } from "@ledgerhq/hw-transport";
export declare class Communication {
    static createTransport(): Promise<Transport>;
}
