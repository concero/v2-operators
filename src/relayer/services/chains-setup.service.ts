import { BlockManager, ConceroNetwork } from '@concero/operator-utils';

import { ContextProvider } from '../services/context.provider';
import { Context } from '../types';

export abstract class ChainsSetupService extends ContextProvider {
    protected constructor(name: string, context: Context) {
        super(name, context);
        this.setupEachHandler();
        setInterval(() => this.setupEachHandler(), 60 * 1000);
    }

    protected setupEachHandler(): void {
        const activeNetworks: ConceroNetwork[] = this.context.network.getActiveNetworks();
        this.logger.debug(
            `Got ${activeNetworks.length} active networks: ${activeNetworks.map(i => i.name).join(', ')}`,
        );

        for (const network of activeNetworks) {
            const blockManager = this.context.blockRegistry.getBlockManager(network.name);

            if (!blockManager) {
                this.logger.warn(
                    `No block manager available for ${network.name}, skipping event setup`,
                );
                continue;
            }

            this.setupHandler(network, blockManager as BlockManager);
        }
    }

    protected abstract setupHandler(network: ConceroNetwork, blockManager: BlockManager): void;
}
