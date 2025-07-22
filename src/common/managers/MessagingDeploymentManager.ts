import { Address } from "viem";

import { LoggerInterface } from "@concero/operator-utils";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { DeploymentManagerConfig } from "../../types/ManagerConfigs";
import { IMessagingDeploymentManager, NetworkUpdateListener } from "../../types/managers";
import { getEnvVar } from "../utils/getEnvVar";

import { DeploymentFetcher, DeploymentPattern, ParsedDeployment } from "@concero/operator-utils";
import { ManagerBase } from "./ManagerBase";

export class MessagingDeploymentManager
    extends ManagerBase
    implements IMessagingDeploymentManager, NetworkUpdateListener
{
    private static instance: MessagingDeploymentManager;

    private conceroRoutersMapByChainName: Record<string, Address> = {};
    private conceroVerifier: Address | undefined;
    private deploymentFetcher: DeploymentFetcher;
    private logger: LoggerInterface;
    private config: DeploymentManagerConfig;

    private readonly routerPattern: DeploymentPattern = /^CONCERO_ROUTER_PROXY_(?!ADMIN)(\w+)$/;
    private readonly verifierPattern: DeploymentPattern = /^CONCERO_VERIFIER_PROXY_(?!ADMIN)(\w+)$/;

    private constructor(logger: LoggerInterface, config: DeploymentManagerConfig) {
        super();
        this.logger = logger;
        this.config = config;
        this.deploymentFetcher = new DeploymentFetcher(logger);
    }

    public static createInstance(
        logger: LoggerInterface,
        config: DeploymentManagerConfig,
    ): MessagingDeploymentManager {
        MessagingDeploymentManager.instance = new MessagingDeploymentManager(logger, config);
        return MessagingDeploymentManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;
        try {
            await super.initialize();
            // Initial fetch of deployments will happen on first network update
            this.logger.debug("Initialized");
        } catch (error) {
            this.logger.error("Failed to initialize:", error);
            throw error;
        }
    }

    public static getInstance(): MessagingDeploymentManager {
        if (!MessagingDeploymentManager.instance) {
            throw new Error(
                "MessagingDeploymentManager is not initialized. Call createInstance() first.",
            );
        }
        return MessagingDeploymentManager.instance;
    }

    async getRouterByChainName(chainName: string): Promise<Address> {
        if (this.config.networkMode === "localhost") {
            return getEnvVar("CONCERO_ROUTER_PROXY_LOCALHOST") as Address;
        }

        const router = this.conceroRoutersMapByChainName[chainName];

        if (!router) {
            throw new Error(`Router not found for chain: ${chainName}`);
        }

        return router;
    }

    async getConceroRouters(): Promise<Record<string, Address>> {
        if (this.config.networkMode === "localhost") {
            return {
                [getEnvVar("LOCALHOST_FORK_CHAIN_ID")]: getEnvVar(
                    "CONCERO_ROUTER_PROXY_LOCALHOST",
                ) as Address,
            };
        }

        return this.conceroRoutersMapByChainName;
    }

    async getConceroVerifier(): Promise<Address> {
        if (this.config.networkMode === "localhost") {
            return getEnvVar("CONCERO_VERIFIER_PROXY_LOCALHOST") as Address;
        }

        if (this.conceroVerifier !== undefined) return this.conceroVerifier;

        if (!this.conceroVerifier) {
            throw new Error("Concero verifier address not found after update");
        }

        return this.conceroVerifier;
    }

    async onNetworksUpdated(networks: ConceroNetwork[]): Promise<void> {
        try {
            const patterns = [this.routerPattern, this.verifierPattern];
            const deployments = await this.deploymentFetcher.getDeployments(
                this.config.conceroDeploymentsUrl,
                patterns,
            );
            await this.processDeployments(deployments, networks);
        } catch (err) {
            this.logger.error("Failed to update deployments after network update:", err);
            throw err;
        }
    }

    private async processDeployments(
        deployments: ParsedDeployment[],
        networks: ConceroNetwork[],
    ): Promise<void> {
        // Create a set for efficient lookup
        const activeNetworkNames = new Set(networks.map(n => n.name));

        // Remove deployments for networks that are no longer active
        const currentNetworkNames = Object.keys(this.conceroRoutersMapByChainName);
        for (const networkName of currentNetworkNames) {
            if (!activeNetworkNames.has(networkName)) {
                delete this.conceroRoutersMapByChainName[networkName];
                this.logger.debug(`Removed deployment for inactive network: ${networkName}`);
            }
        }

        // Process router deployments
        const routerDeployments = deployments.filter(d => d.key.match(this.routerPattern));
        const routerMap: Record<string, Address> = {};

        for (const deployment of routerDeployments) {
            // Only store deployments for active networks
            if (activeNetworkNames.has(deployment.networkName)) {
                routerMap[deployment.networkName] = deployment.value as Address;
            }
        }

        // Update the router deployments
        Object.assign(this.conceroRoutersMapByChainName, routerMap);

        // Process verifier deployment
        const networkSuffix =
            this.config.networkMode === "testnet" ? "arbitrumSepolia" : "arbitrum";
        const verifierDeployment = deployments.find(
            d => d.key.match(this.verifierPattern) && d.networkName === networkSuffix,
        );
        if (verifierDeployment) {
            this.conceroVerifier = verifierDeployment.value as Address;
        }
    }

    public override dispose(): void {
        super.dispose();
        this.conceroRoutersMapByChainName = {};
        this.conceroVerifier = undefined;
    }
}
