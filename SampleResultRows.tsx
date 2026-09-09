"use client";

import { useState } from "react";

type Row = { id: number; analyte: string; value: string; unit: string; qualifier: string };

const starters = [
  { analyte: "Nitrogen", unit: "%" },
  { analyte: "Phosphorus", unit: "%" },
  { analyte: "Potassium", unit: "%" },
  { analyte: "Calcium", unit: "%" },
  { analyte: "Magnesium", unit: "%" },
  { analyte: "Boron", unit: "ppm" },
  { analyte: "Zinc", unit: "ppm" }
];

export default function SampleResultRows({initialRows=[]}:{initialRows?:Array<{analyte:string;value?:string|number|null;unit?:string|null;qualifier?:string|null}>}) {
  const [rows, setRows] = useState<Row[]>(initialRows.length ? initialRows.map((r,i)=>({id:i+1,analyte:r.analyte||"",value:r.value==null?"":String(r.value),unit:r.unit||"",qualifier:r.qualifier||""})) : [
    { id: 1, analyte: "", value: "", unit: "", qualifier: "" },
    { id: 2, analyte: "", value: "", unit: "", qualifier: "" },
    { id: 3, analyte: "", value: "", unit: "", qualifier: "" }
  ]);

  const update = (id:number, key:keyof Row, value:string) => setRows(rs => rs.map(r => r.id === id ? {...r, [key]: value} : r));
  const add = () => setRows(rs => [...rs, { id: Math.max(...rs.map(r=>r.id),0)+1, analyte:"", value:"", unit:"", qualifier:"" }]);
  const remove = (id:number) => setRows(rs => rs.length === 1 ? rs : rs.filter(r => r.id !== id));
  const loadTissue = () => setRows(starters.map((r,i)=>({id:i+1,analyte:r.analyte,value:"",unit:r.unit,qualifier:""})));

  return <div>
    <div className="section-head" style={{marginBottom:10}}>
      <div><h3 style={{marginBottom:3}}>Sample results</h3><p className="subtle" style={{fontSize:13,marginBottom:0}}>Enter only the analytes the lab reported. Add as many rows as needed.</p></div>
      <button className="btn secondary small" type="button" onClick={loadTissue}>Load tissue starter rows</button>
    </div>
    <div className="result-grid result-grid-head"><span>Analyte</span><span>Value</span><span>Unit</span><span>Qualifier</span><span></span></div>
    {rows.map(row => <div className="result-grid" key={row.id}>
      <input name="analyte" value={row.analyte} onChange={e=>update(row.id,"analyte",e.target.value)} placeholder="Potassium" />
      <input name="result_value" value={row.value} onChange={e=>update(row.id,"value",e.target.value)} inputMode="decimal" placeholder="1.34" />
      <input name="unit" value={row.unit} onChange={e=>update(row.id,"unit",e.target.value)} placeholder="% / ppm" />
      <input name="qualifier" value={row.qualifier} onChange={e=>update(row.id,"qualifier",e.target.value)} placeholder="Low / < / >" />
      <button type="button" className="icon-btn" onClick={()=>remove(row.id)} aria-label="Remove result row">×</button>
    </div>)}
    <button type="button" className="btn secondary small" onClick={add} style={{marginTop:10}}>+ Add result row</button>
  </div>;
}
