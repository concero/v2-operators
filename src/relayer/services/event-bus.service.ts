import { EventEmitter } from 'node:events';

import { JobPayload } from '../types';
import { VerifierModule } from '../verifier';

export class EventBusService extends EventEmitter {
    confirmVerification(payload: JobPayload) {
        this.emit(VerifierModule.Confirm.command, payload);
    }
}
