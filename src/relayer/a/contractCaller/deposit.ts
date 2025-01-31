import { conceroNetworks, globalConfig } from "../../../constants";
import { callContract, getFallbackClients } from "../../common/utils";
import { config } from "../constants";

export async function depositOperator() {
    const depositAmount = 1_000_000;
    const conceroVerifierNetwork = config.networks.conceroVerifier;

    const { publicClient, walletClient, account } =
        await getFallbackClients(conceroVerifierNetwork);

    const txHash = await callContract(publicClient, walletClient, {
        chain: conceroVerifierNetwork.viemChain,
        address: conceroNetworks[conceroVerifierNetwork.name].addresses.conceroVerifier,
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "operatorDeposit",
        args: [globalConfig.OPERATOR_ADDRESS],
        value: depositAmount,
        account,
    });

    const transaction = await publicClient.getTransaction({ hash: txHash });
    console.log(transaction);
}
