import {
    getEnvInt,
    getEnvString,
    globalConfig as operatorUtilsGlobalConfig,
} from '@concero/operator-utils';

import { RelayerGlobalConfig } from '../types/GlobalConfig';

export const globalConfig: RelayerGlobalConfig = {
    ...operatorUtilsGlobalConfig,
    chainOptionsUrl: process.env.CONCERO_NETWORKS_URL as string,
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
