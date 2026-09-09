import AppShell from "@/components/AppShell";
import SampleResultRows from "@/components/SampleResultRows";
import { createSample } from "@/app/actions";

export default async function NewSamplePage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const today = new Date().toISOString().slice(0,10);
  return <AppShell active="Samples"><div className="topbar"><div><h1>Add sample</h1><p className="subtle">Tissue, soil, water, and nematode samples use the same flexible result structure.</p></div></div>
    <form action={createSample} className="card form-card wide"><input type="hidden" name="field_id" value={id}/>
      <div className="form-grid">
        <label><span>Sample type *</span><select name="sample_type" required defaultValue="tissue"><option value="tissue">Tissue</option><option value="soil">Soil</option><option value="water">Water</option><option value="nematode">Nematode</option></select></label>
        <label><span>Sample date *</span><input name="sampled_at" type="date" required defaultValue={today}/></label>
        <label><span>Lab</span><input name="lab_name" placeholder="Dellavalle / A&L / other"/></label>
        <label><span>Sample label / ID</span><input name="sample_label" placeholder="Block 7 July leaf"/></label>
      </div>
      <SampleResultRows/>
      <label style={{marginTop:18}}><span>Sample notes</span><textarea name="notes" rows={4} placeholder="Sampling location, depth, crop stage, unusual conditions, etc."/></label>
      <div className="form-actions"><a className="btn secondary" href={`/fields/${id}`}>Cancel</a><button className="btn" type="submit">Save sample</button></div>
    </form>
  </AppShell>;
}
