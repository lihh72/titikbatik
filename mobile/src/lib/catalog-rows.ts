/** Group virtualized catalog rows, reserving equal space for the last row. */
export function catalogRows<T>(
  items: readonly T[],
  columns: 2 | 3,
): (T | null)[][] {
  const rows: (T | null)[][] = [];
  for (let index = 0; index < items.length; index += columns) {
    const row: (T | null)[] = items.slice(index, index + columns);
    while (row.length < columns) row.push(null);
    rows.push(row);
  }
  return rows;
}
