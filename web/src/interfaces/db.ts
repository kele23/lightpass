export const enum RACES_TYPES {
    RUNNER = 'runner',
    TAKE = 'take',
    PS = 'ps',
}

export type IDItem = Record<string, any> & {
    _id: string;
    _rev?: string;
};

export type PartialRace = {
    name: string;
};

export type Race = PartialRace & IDItem;

export enum Order {
    asc = 'asc',
    desc = 'desc',
}

export type PartialPS = {
    name: string;
    start: number;
    gap: number;
    order: Order;
};

export type PS = IDItem & PartialPS;

export type PartialTime = {
    time: number;
};

export type Time = IDItem & PartialTime;

export enum TakeType {
    start = 0,
    end = 1,
}

export type PartialTake = {
    time: number;
    runner: string;
    ps: string;
    type: TakeType;
    pen?: number;
};

export type Take = IDItem & PartialTake;

export type PartialRunner = {
    name: string;
    number: number;
    category: string;
    team: string;
    fci: string;
    uci: string;
    soc: string;
    naz: string;
};

export type Runner = PartialRunner & IDItem;
