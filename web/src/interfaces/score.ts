import { IDItem } from './db.ts';

export type Score = IDItem & {
    start: number;
    end?: number;
    number: number;
    name: string;
    diff?: number;
    category: string;
    team: string;
    ps: string;
    pos?: number;
};

export type GlobalScore = IDItem & {
    number: number;
    name: string;
    diff?: number;
    category: string;
    team: string;
    pos?: number;
};
