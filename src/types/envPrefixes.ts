export type EnvPrefixes = {
    nodeEnv: string;
    networkMode: string;
    logLevel: string;
    operatorAddress: string;
    operatorPrivateKey: string;
    pollingIntervalMs: string;
    dryRun: string;
    rpcServiceGitBranch: string;
    deploymentsServiceGitBranch: string;
    router: string;
    verifier: string;
    lpToken?: string;
    create3Factory?: string;
    pause?: string;
};
