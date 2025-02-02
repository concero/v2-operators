import { conceroNetworks, globalConfig } from "../../../constants";
import { callContract, getEnvVar, getFallbackClients, logger } from "../../common/utils";
import { config } from "../constants";

const ChainType = {
    EVM: 0,
    NON_EVM: 1,
};

const OperatorRegistrationAction = {
    Register: 0,
    Deregister: 1,
};

export async function registerOperator() {
    try {
        if (getEnvVar("IS_OPERATOR_REGISTERED") === "true") {
            logger.info("Operator already registered");
            return;
        }

        // registration flow
        // later:
        // Register in Symbiotic on Ethereum network
        // Wait for allocated stake on Symbiotic to be deposited before starting operations

        const conceroVerifierNetwork = config.networks.conceroVerifier;

        const chainTypes = [BigInt(ChainType.EVM)];
        const operatorActions = [BigInt(OperatorRegistrationAction.Register)];
        const operatorAddresses = [globalConfig.OPERATOR_ADDRESS];

        const { publicClient, walletClient, account } =
            await getFallbackClients(conceroVerifierNetwork);

        const txHash = await callContract(publicClient, walletClient, {
            chain: conceroVerifierNetwork.viemChain,
            address: conceroNetworks[conceroVerifierNetwork.name].addresses.conceroVerifier,
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            functionName: "requestOperatorRegistration",
            args: [chainTypes, operatorActions, operatorAddresses],
            account,
        });

        logger.info(`Requested operator registration with txHash ${txHash}`);
    } catch (e) {
        logger.error(e);
    }
    // Call registerOperator on ConceroVerifier
    // Wait for operatorRegistered event emission with operator address
    // Update environment variable IS_OPERATOR_REGISTERED to true
}
