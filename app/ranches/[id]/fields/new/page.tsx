import AppShell from "@/components/AppShell";
import { createField } from "@/app/actions";

export default async function NewFieldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppShell><div className="topbar"><div><h1>Add field</h1><p className="subtle">Enter what you know now. The boundary can supply the final acreage later.</p></div></div>
    <form action={createField} className="card form-card"><input type="hidden" name="ranch_id" value={id}/>
      <div className="form-grid">
        <label><span>Field / block name *</span><input name="name" required placeholder="Block 7" /></label>
        <label><span>Estimated acres</span><input name="acres" inputMode="decimal" /></label>
        <label><span>Crop</span><input name="current_crop" placeholder="Walnut" /></label>
        <label><span>Variety</span><input name="variety" placeholder="Tulare" /></label>
        <label><span>Rootstock</span><input name="rootstock" placeholder="Paradox" /></label>
        <label><span>Planting year</span><input name="planting_year" inputMode="numeric" /></label>
        <label><span>Irrigation</span><input name="irrigation_type" placeholder="Double-line drip" /></label>
      </div>
      <label><span>Notes</span><textarea name="notes" rows={4}/></label>
      <div className="form-actions"><button className="btn" type="submit">Create field & map boundary</button></div>
    </form>
  </AppShell>;
}
