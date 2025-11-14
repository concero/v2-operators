import { Abi, Address } from 'viem';
import { type GlobalConfig as OperatorUtilsGlobalConfig } from '@concero/operator-utils';

export type RelayerGlobalConfig = OperatorUtilsGlobalConfig & {
    RELAYER: {
        operatorAddress: Address;
        gasLimit: {
            submitMessageReportOverhead: bigint;
        };
        abi: {
            CONCERO_VERIFIER: Abi;
            CONCERO_ROUTER: Abi;
        };
    };
    NOTIFICATIONS: {
        SLACK: {
            MONITORING_SYSTEM_CHANNEL_ID: string | undefined;
            BOT_TOKEN: string | undefined;
        };
        INTERVAL: number;
    };
};
