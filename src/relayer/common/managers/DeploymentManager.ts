import { Address } from "viem";
import { globalConfig } from "../../../constants";
import { httpQueue } from "../utils/httpClient";
import { getEnvVar } from "../utils/getEnvVar";
import { IDeploymentsManager, NetworkUpdateListener } from "../../../types/managers";
import { logger } from "../utils/logger";

export class DeploymentManager implements IDeploymentsManager, NetworkUpdateListener {
    private static instance: DeploymentManager;

    private conceroRoutersMapByChainName: Record<string, Address> = {};
    private conceroVerifier: Address | undefined;
    private initialized: boolean = false;

    private constructor() {}

    public static getInstance(): DeploymentManager {
        if (!DeploymentManager.instance) {
            DeploymentManager.instance = new DeploymentManager();
        }
        return DeploymentManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await this.updateDeployments();
            this.initialized = true;
            logger.debug("DeploymentManager initialized successfully");
        } catch (error) {
            logger.error("Failed to initialize DeploymentManager:", error);
            throw error;
        }
    }

    async getRouterByChainName(chainName: string): Promise<Address> {
        if (this.isLocalhostEnv()) {
            return getEnvVar("CONCERO_ROUTER_PROXY_LOCALHOST") as Address;
        }

        const router = this.conceroRoutersMapByChainName[chainName];
        if (router !== undefined) return router;

        const updatedRouter = this.conceroRoutersMapByChainName[chainName];
        if (!updatedRouter) {
            throw new Error(`Router not found for chain: ${chainName}`);
        }

        return updatedRouter;
    }

    async getConceroVerifier(): Promise<Address> {
        if (this.isLocalhostEnv()) {
            return getEnvVar("CONCERO_VERIFIER_PROXY_LOCALHOST") as Address;
        }

        if (this.conceroVerifier !== undefined) return this.conceroVerifier;

        if (!this.conceroVerifier) {
            throw new Error("Concero verifier address not found after update");
        }

        return this.conceroVerifier;
    }

    async updateDeployments(): Promise<void> {
        const now = Date.now();

        try {
            const deployments = await httpQueue.get(globalConfig.URLS.CONCERO_DEPLOYMENTS, {
                responseType: "text", // Ensure Axios returns raw text
            });

            const deploymentsEnvArr = deployments.split("\n");

            // Process router deployments
            const conceroRouterDeploymentsEnv = deploymentsEnvArr.filter((d: string) =>
                d.startsWith("CONCERO_ROUTER_PROXY"),
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

            // Find verifier address
            const verifierEntry = deploymentsEnvArr.find((d: string) => {
                const networkSuffix =
                    globalConfig.NETWORK_MODE === "testnet" ? "ARBITRUM_SEPOLIA" : "ARBITRUM";
                return d.startsWith(`CONCERO_VERIFIER_PROXY_${networkSuffix}`);
            });

            if (verifierEntry) {
                this.conceroVerifier = verifierEntry.split("=")[1] as Address;
            }

            this.lastUpdateTime = now;
            logger.debug("Deployments updated successfully");
        } catch (error) {
            logger.error("Failed to update deployments:", error);
            throw new Error(
                `Failed to update deployments: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    onNetworksUpdated(): void {
        logger.debug("DeploymentManager received onNetworksUpdated");
        this.updateDeployments().catch(err =>
            logger.error("Failed to update deployments after network update:", err),
        );
    }

    private extractNetworkName(key: string): string | null {
        const prefix = "CONCERO_ROUTER_PROXY_";
        if (key.startsWith(prefix)) {
            return key.slice(prefix.length);
        }
        return null;
    }

    private isLocalhostEnv(): boolean {
        return globalConfig.NETWORK_MODE === "localhost";
    }
}

export const deploymentsManager = DeploymentManager.getInstance();
