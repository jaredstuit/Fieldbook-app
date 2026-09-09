import { pacificInputValue } from "@/lib/field";
import AppShell from "@/components/AppShell";
import { createFieldNote } from "@/app/actions";

export default async function NewNotePage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <AppShell active="Fields"><div className="topbar"><div><h1>Add field note</h1><p className="subtle">Capture what you saw, heard from the grower, or want to remember later.</p></div></div>
    <form action={createFieldNote} className="card form-card"><input type="hidden" name="field_id" value={id}/>
      <div className="form-grid"><label><span>Date & time</span><input type="datetime-local" name="observed_at" defaultValue={pacificInputValue()}/></label><label><span>Tags</span><input name="tags" placeholder="mites, irrigation, west side" /></label></div>
      <label><span>Note *</span><textarea name="note" rows={8} required placeholder="Example: Northwest corner showing more mite pressure, mostly on trees adjacent to the dirt road..."/></label>
      <div className="form-actions"><a className="btn secondary" href={`/fields/${id}`}>Cancel</a><button className="btn" type="submit">Save note</button></div>
    </form>
  </AppShell>;
}
