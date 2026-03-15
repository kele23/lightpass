export type IDItem = Record<string, any> & {
  _id: string;
  _rev?: string;
};

export type AllDocsResponse<T extends IDItem> = {
  total_rows: number;
  offset: number;
  rows: Array<{
    id: string;
    key: string;
    value: {
      rev: string;
    };
    doc?: T;
  }>;
};
