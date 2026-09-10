"use client";

import Link from "next/link";
import SortableTable from "@/components/SortableTable";

type GrowerRow = { id: string; name: string; ranchCount: number; fieldCount: number; acres: number };

export default function GrowersTable({ rows }: { rows: GrowerRow[] }) {
  return (
    <SortableTable
      rows={rows}
      rowKey={g => g.id}
      defaultSortKey="name"
      columns={[
        { key: "name", label: "Grower", accessor: g => g.name, render: g => <Link href={`/growers/${g.id}`}><strong>{g.name}</strong></Link> },
        { key: "ranchCount", label: "Ranches", accessor: g => g.ranchCount },
        { key: "fieldCount", label: "Fields", accessor: g => g.fieldCount },
        { key: "acres", label: "Acres", accessor: g => g.acres, render: g => g.acres.toFixed(1) }
      ]}
    />
  );
}
