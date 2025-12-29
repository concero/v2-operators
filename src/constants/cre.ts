import { Hex } from 'viem';

export const allowedSignerAddresses: Hex[] = String(process.env.CRE_ALLOWED_SIGNERS)
    .split(',')
    .map(i => i.trim().toLowerCase())
    .map(i => (i.startsWith('0x') ? i : `0x${i}`) as Hex);
