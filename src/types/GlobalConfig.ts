import { type GlobalConfig as OperatorUtilsGlobalConfig } from '@concero/operator-utils';

export type RelayerGlobalConfig = OperatorUtilsGlobalConfig & {
    chainOptionsUrl: string;
    NOTIFICATIONS: {
        SLACK: {
            MONITORING_SYSTEM_CHANNEL_ID: string | undefined;
            BOT_TOKEN: string | undefined;
        };
        INTERVAL: number;
    };
};
