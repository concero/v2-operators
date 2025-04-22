import { Address } from "viem";
import { globalConfig } from "../../../constants";
import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { getNetworkName } from "./getNetworkName";
import { httpClient } from "./httpClient";
import { getEnvVar } from "./getEnvVar";

export class DeploymentsManager {
    private conceroRoutersMapByChainName: Record<ConceroNetworkNames, Address> = {};
    private conceroVerifier: Address | undefined;

    async getRouterByChainName(chainName: ConceroNetworkNames) {
        if (this.isLocalhostEnv()) {
            return getEnvVar("CONCERO_ROUTER_PROXY_LOCALHOST");
        }

        const router = this.conceroRoutersMapByChainName[chainName];

        if (router !== undefined) return router;

        await this.updateDeployments();

        return this.conceroRoutersMapByChainName[chainName];
    }

    async getConceroVerifier() {
        if (this.isLocalhostEnv()) {
            return getEnvVar("CONCERO_VERIFIER_PROXY_LOCALHOST");
        }

        if (this.conceroVerifier !== undefined) return this.conceroVerifier;

        await this.updateDeployments();

        return this.conceroVerifier;
    }

    private async updateDeployments() {
        const deploymentsEnv = await (
            await httpClient.get(globalConfig.URLS.CONCERO_DEPLOYMENTS)
        ).text();

        const deploymentsEnvArr = deploymentsEnv.split("\n");
        const conceroRouterDeploymentsEnv = deploymentsEnvArr.filter((d: string) =>
            d.startsWith("CONCERO_ROUTER_PROXY"),
        );

        for (const deploymentEnv of conceroRouterDeploymentsEnv) {
            const [name, address] = deploymentEnv.split("=");
            conceroRouterDeploymentsEnv[getNetworkName(name.slice(21, name.length))] = address;
        }

        this.conceroVerifier = deploymentsEnvArr
            .find((d: string) => {
                return d.startsWith(
                    "CONCERO_VERIFIER_PROXY_" +
                        (globalConfig.NETWORK_MODE === "testnet" ? "ARBITRUM_SEPOLIA" : "ARBITRUM"),
                );
            })
            .split("=")[1];
    }

    private isLocalhostEnv() {
        return globalConfig.NETWORK_MODE === "localhost";
    }
}
