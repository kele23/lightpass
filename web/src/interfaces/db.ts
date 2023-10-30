export interface IDItem {
    _id?: string;
    [propName: string]: any;
}

export interface Race extends IDItem {
    name: string;
}

export enum Order {
    asc = 'asc',
    desc = 'desc',
}

export interface PS extends IDItem {
    name: string;
    start: number;
    gap: number;
    order: Order;
}

export interface Time extends IDItem {
    time: number;
}

export enum TakeType {
    start = 0,
    end = 1,
}

export interface Take extends IDItem {
    time: number;
    runner: string;
    ps: string;
    type: TakeType;
}

export interface Runner extends IDItem {
    name: string;
    number: number;
    category: string;
    team: string;
    fci: string;
    uci: string;
    soc: string;
    naz: string;
}
