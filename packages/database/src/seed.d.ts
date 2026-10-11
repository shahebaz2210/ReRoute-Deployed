export declare const DEMO_IDS: {
    orgId: string;
    dispatcherId: string;
    managerId: string;
    depotId: string;
    planId: string;
    v1Id: string;
    v2Id: string;
    v3Id: string;
};
export declare const DEMO_LOCATIONS: {
    id: string;
    code: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}[];
export declare function getPrecomputedDistanceMatrix(): {
    distances: number[][];
    durations: number[][];
    locations: {
        id: string;
        code: string;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
    }[];
};
