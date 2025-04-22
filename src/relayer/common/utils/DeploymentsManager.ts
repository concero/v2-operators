import { Address } from "viem";
import { globalConfig } from "../../../constants";
import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { getNetworkName } from "./getNetworkName";
import { httpClient } from "./httpClient";

export class DeploymentsManager {
    private conceroRoutersMapByChainName: Record<ConceroNetworkNames, Address> = {};
    private conceroVerifier: Address | undefined;

    async getRouterByChainName(chainName: ConceroNetworkNames) {
        const router = this.conceroRoutersMapByChainName[chainName];

        if (router !== undefined) return router;

        await this.updateDeployments();

        return this.conceroRoutersMapByChainName[chainName];
    }

    async getConceroVerifier() {
        if (this.conceroVerifier !== undefined) return this.conceroVerifier;

        await this.updateDeployments();

        return this.conceroVerifier;
    }

    private async updateDeployments() {
        const deploymentsEnv = await httpClient.get(globalConfig.URLS.CONCERO_DEPLOYMENTS);
        console.log(deploymentsEnv);
        const deploymentsEnvArr = deploymentsEnv.split("\n");
        const conceroRouterDeploymentsEnv = deploymentsEnvArr.find((d: string) =>
            d.startsWith("CONCERO_ROUTER_PROXY"),
        );

        for (const deploymentEnv of conceroRouterDeploymentsEnv) {
            const [name, address] = deploymentEnv.split("=");
            conceroRouterDeploymentsEnv[getNetworkName(name.slice(21, name.length))] = address;
        }

        this.conceroVerifier = deploymentsEnvArr.findLast((d: string) =>
            d.startsWith("CONCERO_VERIFIER_PROXY"),
        );
    }
}
