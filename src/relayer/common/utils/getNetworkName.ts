export function getNetworkName(networkEnvKey: string): string {
    if (!networkEnvKey) {
        throw new Error("Network name must be provided");
    }

    return networkEnvKey
        .toLowerCase()
        .split("_")
        .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
        .join("");
}
