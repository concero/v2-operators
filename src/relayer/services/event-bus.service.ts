import { EventEmitter } from 'node:events';

import { VerifierModule, VerifierStrategy } from '../verifier';

export class EventBusService extends EventEmitter {
    requestVerification(payload: VerifierStrategy.Payload) {
        this.emit(VerifierModule.Request.command, payload);
    }

    confirmVerification(payload: VerifierStrategy.Payload) {
        this.emit(VerifierModule.Confirm.command, payload);
    }
}
