import { Static, Type } from "@sinclair/typebox";
import { IDItem } from "../types";

export const User = Type.Composite([IDItem, Type.Object({
    name: Type.String(),
    roles: Type.Array(Type.String())
})]);

export type UserType = Static<typeof User>;