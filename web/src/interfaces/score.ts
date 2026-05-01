import { IDItem } from '../../types/iditem.ts';

export type Score = IDItem & {
  start: number;
  end?: number;
  number: number;
  name: string;
  diff?: number;
  pen?: number;
  category: string;
  team: string;
  fci?: string;
  uci?: string;
  naz?: string;
  ps: string;
  pos?: number;
  status?: 'assigned' | 'missing' | 'waiting' | 'retired';
  retired?: boolean;
  hasStart: boolean;
};

export type GlobalScore = IDItem & {
  number: number;
  name: string;
  diff?: number;
  pen?: number;
  category: string;
  team: string;
  fci?: string;
  uci?: string;
  naz?: string;
  pos?: number;
};
