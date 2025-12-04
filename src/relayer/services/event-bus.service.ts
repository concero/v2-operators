import { EventEmitter } from 'node:events';

import { VerifierModule } from '../verifier';

export class EventBusService extends EventEmitter {
    requestVerification(payload: VerifierModule.Request.Payload) {
        this.emit(VerifierModule.Request.command, payload);
    }

    confirmVerification(payload: VerifierModule.Confirm.Payload) {
        this.emit(VerifierModule.Confirm.command, payload);
    }
}
