import { Address } from "viem";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { DeploymentManagerConfig } from "../../types/ManagerConfigs";
import { IDeploymentsManager, NetworkUpdateListener } from "../../types/managers";
import { getEnvVar } from "../utils/getEnvVar";
import { HttpClient } from "../utils/HttpClient";
import { LoggerInterface } from "../utils/Logger";

import { ManagerBase } from "./ManagerBase";

// Keeps updatable lists of ConceroVerifier and ConceroRouter contracts.
export class DeploymentManager
    extends ManagerBase
    implements IDeploymentsManager, NetworkUpdateListener
{
    private static instance: DeploymentManager;

    private conceroRoutersMapByChainName: Record<string, Address> = {};
    private conceroVerifier: Address | undefined;
    private httpClient: HttpClient;
    private logger: LoggerInterface;
    private config: DeploymentManagerConfig;

    private constructor(logger: LoggerInterface, config: DeploymentManagerConfig) {
        super();
        this.httpClient = HttpClient.getInstance();
        this.logger = logger;
        this.config = config;
    }

    public static createInstance(
        logger: LoggerInterface,
        config: DeploymentManagerConfig,
    ): DeploymentManager {
        DeploymentManager.instance = new DeploymentManager(logger, config);
        return DeploymentManager.instance;
    }

    public static getInstance(): DeploymentManager {
        if (!DeploymentManager.instance) {
            throw new Error("DeploymentManager is not initialized. Call createInstance() first.");
        }
        return DeploymentManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;
        try {
            await super.initialize();
            this.logger.debug("Initialized");
        } catch (error) {
            this.logger.error("Failed to initialize:", error);
            throw error;
        }
    }

    async getRouterByChainName(chainName: string): Promise<Address> {
        if (this.isLocalhostEnv()) {
            return getEnvVar("CONCERO_ROUTER_PROXY_LOCALHOST") as Address;
        }

        const router = this.conceroRoutersMapByChainName[chainName];
        if (router !== undefined) return router;

        await this.updateDeployments();

        const updatedRouter = this.conceroRoutersMapByChainName[chainName];
        if (!updatedRouter) {
            throw new Error(`Router not found for chain: ${chainName}`);
        }

        return updatedRouter;
    }

    async getConceroRouters(): Promise<Record<string, Address>> {
        if (this.isLocalhostEnv()) {
            return {
                [getEnvVar("LOCALHOST_FORK_CHAIN_ID")]: getEnvVar(
                    "CONCERO_ROUTER_PROXY_LOCALHOST",
                ) as Address,
            };
        }

        const routers = this.conceroRoutersMapByChainName;
        return routers;
    }

    async getConceroVerifier(): Promise<Address> {
        if (this.isLocalhostEnv()) {
            return getEnvVar("CONCERO_VERIFIER_PROXY_LOCALHOST") as Address;
        }

        if (this.conceroVerifier !== undefined) return this.conceroVerifier;

        await this.updateDeployments();

        if (!this.conceroVerifier) {
            throw new Error("Concero verifier address not found after update");
        }

        return this.conceroVerifier;
    }

    async updateDeployments(): Promise<void> {
        const now = Date.now();

        try {
            const deployments = await this.httpClient.get(this.config.conceroDeploymentsUrl, {
                responseType: "text", // Ensure Axios returns raw text
            });

            const deploymentsEnvArr = deployments.split("\n");

            const conceroRouterDeploymentsEnv = deploymentsEnvArr.filter(
                (d: string) =>
                    d.startsWith("CONCERO_ROUTER_PROXY") &&
                    !d.startsWith("CONCERO_ROUTER_PROXY_ADMIN"),
            );

            const routerMap: Record<string, Address> = {} as Record<string, Address>;

            for (const deploymentEnv of conceroRouterDeploymentsEnv) {
                const [name, address] = deploymentEnv.split("=");
                const networkName = this.extractNetworkName(name);
                if (networkName) {
                    routerMap[networkName as string] = address as Address;
                }
            }

            this.conceroRoutersMapByChainName = routerMap;

            const verifierEntry = deploymentsEnvArr.find((d: string) => {
                const networkSuffix =
                    this.config.networkMode === "testnet" ? "ARBITRUM_SEPOLIA" : "ARBITRUM";
                return d.startsWith(`CONCERO_VERIFIER_PROXY_${networkSuffix}`);
            });

            if (verifierEntry) {
                this.conceroVerifier = verifierEntry.split("=")[1] as Address;
            }

            this.lastUpdateTime = now;
            this.logger.debug("Deployments updated");
        } catch (error) {
            this.logger.error("Failed to update deployments:", error);
            throw new Error(
                `Failed to update deployments: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    async onNetworksUpdated(networks: ConceroNetwork[]): Promise<void> {
        // this.logger.debug("Received onNetworksUpdated");
        try {
            await this.updateDeployments();
        } catch (err) {
            this.logger.error("Failed to update deployments after network update:", err);
            throw err;
        }
    }

    private extractNetworkName(key: string): string | null {
        const prefix = "CONCERO_ROUTER_PROXY_";

        const parts = key.slice(prefix.length).toLowerCase().split("_");
        return (
            parts[0] +
            parts
                .slice(1)
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join("")
        );
    }

    private isLocalhostEnv(): boolean {
        return this.config.networkMode === "localhost";
    }

    public override dispose(): void {
        super.dispose();
        this.logger.debug("Disposed");
    }
}
