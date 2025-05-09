import { ConceroNetwork } from "@concero/contract-utils";
import { viemClientManager } from "../managers/ViemClientManager";

const DEFAULT_GAS_LIMIT = 1_000_000n;
const SAFE_TXS_COUNT_FOR_OPERATOR_BALANCE = 10n;

export async function getChainOperatorMinBalance(conceroNetwork: ConceroNetwork) {
    const { publicClient } = viemClientManager?.getClients(conceroNetwork);
    const currentGasPrice = await publicClient.getGasPrice();
    const averageTxCostInWei = currentGasPrice * DEFAULT_GAS_LIMIT;

    return averageTxCostInWei * SAFE_TXS_COUNT_FOR_OPERATOR_BALANCE;
}
