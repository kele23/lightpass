import { IDItem } from '../../types/iditem.ts';

export const enum RACES_TYPES {
  RUNNER = 'runner',
  TAKE = 'take',
  PS = 'ps',
  TIME = 'time',
}

export enum Order {
  asc = 'asc',
  desc = 'desc',
  time = 'time',
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
  deviceId: string;
};

export type Time = IDItem & PartialTime;

export enum TakeType {
  start = 0,
  end = 1,
  retired = 2,
}

export type PartialTake = {
  time?: number;
  runner: string;
  ps: string;
  type: TakeType;
  pen?: number;
};

export type Take = IDItem & PartialTake;

export type FriendlyTake = Take & {
  runnerNumber: number;
  runnerName: string;
  psName: string;
};

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
