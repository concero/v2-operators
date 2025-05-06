import { createNonceManager } from "viem";
import { NonceManagerSource } from "./NonceManagerSource";

export const nonceManager = createNonceManager({
    source: NonceManagerSource.getInstance(),
});
