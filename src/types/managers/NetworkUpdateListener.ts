export interface NetworkUpdateListener {
    onNetworksUpdated(networks: any[]): Promise<void> | void;
}
