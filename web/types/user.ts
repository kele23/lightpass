import { IDItem } from './iditem.ts';

// user
export type User = IDItem & {
  name: string;
  roles: string[];
};

// token & refresh
export type UserTokenPayload = User;
export type UserRefreshPayload = {
  name: string;
  refresh: boolean;
};
