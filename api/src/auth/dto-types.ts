
import { Static, Type } from '@sinclair/typebox';
import { UserType } from '../user/types';

/// internal authentication userToken type
export type UserTokenPayload = UserType;

export type UserRefreshPayload = {
    name: string,
    refresh: boolean
};


///////////////// DTO
export const LoginReq = Type.Object({
    name: Type.String(),
    password: Type.String(),
});

export type LoginReqType = Static<typeof LoginReq>;

export const LoginResp = Type.Object({
    refreshToken: Type.String(),
});

export type LoginRespType = Static<typeof LoginResp>;

export const RefreshReq = Type.Object({
    refreshToken: Type.String(),
});

export type RefreshReqType = Static<typeof RefreshReq>;

export const RefreshResp = Type.Object({
    ok: Type.Boolean()
});

export type RefreshRespType = Static<typeof RefreshResp>;

export const CheckResp = Type.Object({
    name: Type.String(),
    roles: Type.Array(Type.String()),
});

export type CheckRespType = Static<typeof CheckResp>;
