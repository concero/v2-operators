import { Abi } from 'viem';
import {
    getEnvBigint,
    getEnvInt,
    getEnvString,
    globalConfig as operatorUtilsGlobalConfig,
} from '@concero/operator-utils';

import { abi as conceroRouterAbi } from '../abi/ConceroRouter.json';
import { abi as conceroVerifierAbi } from '../abi/ConceroVerifier.json';
import { RelayerGlobalConfig } from '../types/GlobalConfig';

export const relayerConfig: RelayerGlobalConfig = {
    RELAYER: {
        operatorAddress: getEnvString('OPERATOR_ADDRESS'),
        gasLimit: {
            submitMessageReportOverhead: getEnvBigint(
                'TX_WRITER_GAS_LIMIT_SUBMIT_MESSAGE_REPORT_OVERHEAD',
                1_000_000n,
            ),
        },
        abi: {
            CONCERO_VERIFIER: conceroVerifierAbi as Abi,
            CONCERO_ROUTER: conceroRouterAbi as Abi,
        },
    },
    NOTIFICATIONS: {
        SLACK: {
            MONITORING_SYSTEM_CHANNEL_ID: getEnvString(
                'NOTIFICATIONS_SLACK_MONITORING_SYSTEM_CHANNEL_ID',
                '',
            ),
            BOT_TOKEN: getEnvString('NOTIFICATIONS_SLACK_BOT_TOKEN', ''),
        },
        INTERVAL: getEnvInt('NOTIFICATIONS_INTERVAL', 60 * 60 * 1000),
    },
};

const globalConfig: RelayerGlobalConfig = {
    ...operatorUtilsGlobalConfig,
    ...relayerConfig,
};
export { globalConfig };
