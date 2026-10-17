/** Preserve page order/identities while checking existing IDs once per page. */
export function appendCatalogPage<T extends { id: string }>(
  current: T[],
  incoming: T[],
): T[] {
  const known = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !known.has(item.id))];
}
