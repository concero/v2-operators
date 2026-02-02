import { createHash } from 'crypto';
import process from 'node:process';
import { Hex, parseSignature } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import axios from 'axios';
import stringify from 'json-stable-stringify';

import { CRE } from '../../types';

// @todo: move to utils
const sha256 = (data: unknown): string => {
    const jsonString = typeof data === 'string' ? data : (stringify(data) ?? '');
    return createHash('sha256').update(jsonString).digest('hex');
};
// @todo: move to utils
const base64URLEncode = (str: string): string =>
    str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

export class CREExecutorService {
    private readonly CRE_WORFLOW_ID: string;
    private readonly CRE_BASE_URL: string;
    private readonly CRE_REQUESTER_PRIVATE_KEY: Hex;

    constructor() {
        // @todo: fix types & implement type check
        // @todo: make global environment configuration system
        this.CRE_WORFLOW_ID = process.env.CRE_WORKFLOW_ID as string;
        this.CRE_BASE_URL = process.env.CRE_BASE_URL as string;
        this.CRE_REQUESTER_PRIVATE_KEY = process.env.CRE_REQUESTER_PRIVATE_KEY as Hex;
    }

    async execute(batch: CRE.Request['batch']) {
        const requestBody: CRE.Body<CRE.Request> = {
            jsonrpc: '2.0',
            id: crypto.randomUUID(),
            method: 'workflows.execute',
            params: {
                input: {
                    batch,
                },
                workflow: { workflowID: this.CRE_WORFLOW_ID },
            },
        };
        const token = await this.encryptJWT(requestBody, this.CRE_REQUESTER_PRIVATE_KEY);
        await axios.post(this.CRE_BASE_URL, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
    }

    private async encryptJWT(request: CRE.Body<CRE.Request>, privateKey: Hex): Promise<string> {
        const account = privateKeyToAccount(privateKey);
        const address = account.address;

        // Create JWT header
        const header = {
            alg: 'ETH',
            typ: 'JWT',
        };

        // Create JWT payload with request and metadata
        const now = Math.floor(Date.now() / 1000);

        // Note: Request needs to be in the following order:
        // Version string  `json:"jsonrpc"`
        // ID      string  `json:"id"`
        // Method  string  `json:"method"`
        // Params  *Params `json:"params"`

        const payload = {
            digest: `0x${sha256(request as unknown as Hex)}`,
            iss: address,
            iat: now,
            exp: now + 300, // 5 minutes expiration
            jti: crypto.randomUUID(),
        };

        // Encode header and payload to base64url
        const encodedHeader = base64URLEncode(
            Buffer.from(JSON.stringify(header), 'utf8').toString('base64'),
        );
        const encodedPayload = base64URLEncode(
            Buffer.from(JSON.stringify(payload), 'utf8').toString('base64'),
        );
        const rawMessage = `${encodedHeader}.${encodedPayload}`;

        // Sign the message - viem's signMessage handles the Ethereum Signed Message prefix and hashing
        const signature = await account.signMessage({
            message: rawMessage,
        });

        // Convert signature to JWT format (r, s, v components)
        const { r, s, v, yParity } = parseSignature(signature);
        // Use yParity if v is undefined (yParity is 0 or 1)
        const recoveryId = v !== undefined ? (v >= 27n ? v - 27n : v) : yParity;

        if (recoveryId === undefined) {
            throw new Error('Unable to extract recovery ID from signature');
        }

        // Combine r, s, and adjusted v into a single buffer
        // Ensure r and s are exactly 32 bytes each by padding with leading zeros if needed
        const rBuffer = Buffer.from(r.slice(2).padStart(64, '0'), 'hex'); // 32 bytes = 64 hex chars
        const sBuffer = Buffer.from(s.slice(2).padStart(64, '0'), 'hex'); // 32 bytes = 64 hex chars
        const signatureBytes = Buffer.concat([rBuffer, sBuffer, Buffer.from([Number(recoveryId)])]);
        const encodedSignature = base64URLEncode(signatureBytes.toString('base64'));
        return `${rawMessage}.${encodedSignature}`;
    }
}
