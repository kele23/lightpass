
import { Static, Type } from '@sinclair/typebox';
import { IDItem } from '../types';


export const Race = Type.Composite([IDItem, Type.Object({
    name: Type.String(),
})]);
export type RaceType = Static<typeof Race>;

export const Races = Type.Array(Race);
export type RacesType = Static<typeof Races>;

export const RaceCreate = Type.Object({
    name: Type.String()
});
export type RaceCreateType = Static<typeof RaceCreate>;
