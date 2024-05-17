import { Static, Type } from "@sinclair/typebox";

export const IDItem = Type.Object({
    _id: Type.String(),
    _rev: Type.Optional(Type.String())
});

export type IDItemType = Static<typeof IDItem>;;