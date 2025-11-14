import { Log } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';

export enum LogType {
    MessageSent = 'messageSent',
    ReportRequested = 'reportRequested',
}

export interface LogStrategy {
    onLogs(logs: Log[], network: ConceroNetwork): Promise<void>;
}
