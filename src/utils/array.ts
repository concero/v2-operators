export namespace ArrayLib {
    export const toChunks = <T>(list: T[], size: number): T[][] => {
        const chunks: T[][] = [];

        for (let i = 0; i < list.length; i += size) {
            chunks.push(list.slice(i, i + size));
        }

        return chunks;
    };

    export const deduplicate = <T extends string | number>(list: T[]): T[] => {
        return Array.from(new Set(list));
    };
}
