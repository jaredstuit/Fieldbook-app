"use client";

import Link from "next/link";
import SortableTable from "@/components/SortableTable";

type FieldRow = { id: string; name: string; growerName: string | null; ranchName: string | null; cropLabel: string | null; acres: number | null };

export default function FieldsTable({ rows }: { rows: FieldRow[] }) {
  return (
    <SortableTable
      rows={rows}
      rowKey={f => f.id}
      defaultSortKey="name"
      columns={[
        { key: "name", label: "Field", accessor: f => f.name, render: f => <Link href={`/fields/${f.id}`}><strong>{f.name}</strong></Link> },
        { key: "growerName", label: "Grower", accessor: f => f.growerName, render: f => f.growerName || "—" },
        { key: "ranchName", label: "Ranch", accessor: f => f.ranchName, render: f => f.ranchName || "—" },
        { key: "cropLabel", label: "Crop", accessor: f => f.cropLabel, render: f => f.cropLabel || "—" },
        { key: "acres", label: "Acres", accessor: f => f.acres, render: f => (f.acres != null ? f.acres.toFixed(2) : "—") }
      ]}
    />
  );
}
