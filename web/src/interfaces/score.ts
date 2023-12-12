export interface Score {
    start: number;
    end?: number;
    number: number;
    name: string;
    diff?: number;
    category: string;
    team: string;
    ps: string;
    pos?: number;
}

export interface GlobalScore {
    number: number;
    name: string;
    diff?: number;
    category: string;
    team: string;
    pos?: number;
}
