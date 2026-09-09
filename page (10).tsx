import AppShell from "@/components/AppShell";
import { createRanch } from "@/app/actions";

export default async function NewRanchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppShell><div className="topbar"><div><h1>Add ranch</h1><p className="subtle">A ranch groups related fields for the same grower.</p></div></div>
    <form action={createRanch} className="card form-card"><input type="hidden" name="grower_id" value={id}/>
      <label><span>Ranch name *</span><input name="name" required placeholder="e.g. River Ranch" /></label>
      <label><span>Notes</span><textarea name="notes" rows={4}/></label>
      <div className="form-actions"><a className="btn secondary" href={`/growers/${id}`}>Cancel</a><button className="btn" type="submit">Save ranch</button></div>
    </form>
  </AppShell>;
}
