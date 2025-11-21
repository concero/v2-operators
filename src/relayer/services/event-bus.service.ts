import { EventEmitter } from 'node:events';

import { VerifierProcessor } from '../verifier';

export class EventBusService extends EventEmitter {
    requestVerify(payload: VerifierProcessor.Payload) {
        this.emit(VerifierProcessor.command, payload);
    }
}
