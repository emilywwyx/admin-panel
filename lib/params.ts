export type SearchParams = Record<string, string | string[] | undefined>;

export function param(params: SearchParams, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function pageParam(params: SearchParams): number {
  const page = Number(param(params, "page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function withParams(path: string, values: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "" && !(key === "page" && value === 1)) {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
