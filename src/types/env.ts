import { Address } from "viem";

export interface env {
    OPERATOR_ADDRESS: Address;
    OPERATOR_PRIVATE_KEY: string;
    INFURA_API_KEY: string;
    ALCHEMY_API_KEY: string;
    CONCERO_VERIFIER_LOCALHOST: Address;
    CONCERO_VERIFIER_BASE_SEPOLIA: Address;
    CONCERO_VERIFIER_ARBITRUM_SEPOLIA: Address;
    CONCERO_ROUTER_LOCALHOST: Address;
    CONCERO_ROUTER_BASE_SEPOLIA: Address;
    CONCERO_ROUTER_ARBITRUM_SEPOLIA: Address;
    CONCERO_ROUTER_AVALANCHE_FUJI: Address;
    CONCERO_ROUTER_POLYGON_AMOY: Address;
    CONCERO_ROUTER_OPTIMISM_SEPOLIA: Address;
}

export default env;
