"use client";

import Link from "next/link";
import SortableTable from "@/components/SortableTable";

type RanchFieldRow = { id: string; name: string; variety: string | null; current_crop: string | null; acres: number | string | null };

export default function RanchFieldsTable({ rows }: { rows: RanchFieldRow[] }) {
  return (
    <SortableTable
      rows={rows}
      rowKey={f => f.id}
      defaultSortKey="name"
      columns={[
        { key: "name", label: "Field", accessor: f => f.name, render: f => <Link href={`/fields/${f.id}`}><strong>{f.name}</strong></Link> },
        { key: "crop", label: "Crop", accessor: f => f.current_crop || null, render: f => f.current_crop || "—" },
        { key: "variety", label: "Variety", accessor: f => f.variety || null, render: f => f.variety || "—" },
        { key: "acres", label: "Acres", accessor: f => (f.acres != null ? Number(f.acres) : null), render: f => f.acres ?? "—" }
      ]}
    />
  );
}
