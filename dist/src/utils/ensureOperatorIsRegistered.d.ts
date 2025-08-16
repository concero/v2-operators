import { type Address, Hash } from 'viem';
import { ConceroNetwork } from '../types/ConceroNetwork';
/**
 * Waits for the operator registration event on the ConceroVerifier contract by polling blocks.
 * This function continuously polls for new blocks and checks for OperatorRegistered events
 * that match the specified operator address.
 *
 * @param network - The network instance to monitor.
 * @param contractAddress - The address of the ConceroVerifier contract.
 * @param fromBlockNumber - The block number from which to start polling.
 * @param operatorAddress - The operator address to wait for registration.
 * @returns {Promise<Hash>} The transaction hash of the operator registration.
 */
export declare function waitForOperatorRegistration(network: ConceroNetwork, contractAddress: Address, fromBlockNumber: bigint, operatorAddress: string): Promise<Hash>;
/**
 * Ensures that the operator is registered in the ConceroVerifier contract. If the operator is not
 * registered, it will request registration and wait for the registration to be confirmed.
 *
 * @returns {Promise<void>}
 */
export declare function ensureOperatorIsRegistered(): Promise<void>;
//# sourceMappingURL=ensureOperatorIsRegistered.d.ts.map