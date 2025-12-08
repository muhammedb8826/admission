export type StrapiMeta = Record<string, unknown>;

export type StrapiSingleResponse<TData> = {
  data: TData;
  meta: StrapiMeta;
};

export type StrapiCollectionResponse<TData> = {
  data: TData[];
  meta: StrapiMeta;
};

export type StrapiRelation<T> = T | null;

