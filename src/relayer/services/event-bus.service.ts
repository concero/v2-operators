import { EventEmitter } from 'node:events';

import { JobPayload } from '../types';
import { VerifierModule } from '../verifier';

export class EventBusService extends EventEmitter {
    requestVerification(payload: JobPayload) {
        this.emit(VerifierModule.Request.command, payload);
    }

    confirmVerification(payload: JobPayload) {
        this.emit(VerifierModule.Confirm.command, payload);
    }
}
