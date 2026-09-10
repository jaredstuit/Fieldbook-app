"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export type SortableColumn<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  accessor: (row: T) => string | number | null;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

export default function SortableTable<T>({
  columns,
  rows,
  rowKey,
  defaultSortKey,
  defaultDirection = "asc"
}: {
  columns: SortableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  defaultSortKey?: string;
  defaultDirection?: "asc" | "desc";
}) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [direction, setDirection] = useState<"asc" | "desc">(defaultDirection);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find(c => c.key === sortKey);
    if (!col) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.accessor(a);
      const bv = col.accessor(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
    });
    if (direction === "desc") copy.reverse();
    return copy;
  }, [rows, sortKey, direction, columns]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setDirection(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  };

  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key}>
              {col.sortable === false ? (
                col.label
              ) : (
                <button type="button" className="sort-th" onClick={() => toggleSort(col.key)}>
                  {col.label}
                  {sortKey === col.key ? (
                    direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} className="sort-icon-idle" />
                  )}
                </button>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map(row => (
          <tr key={rowKey(row)}>
            {columns.map(col => (
              <td key={col.key} className={col.className}>
                {col.render ? col.render(row) : col.accessor(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
