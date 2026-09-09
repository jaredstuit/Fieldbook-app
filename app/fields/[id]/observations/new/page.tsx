import AppShell from "@/components/AppShell";
import { createObservation } from "@/app/actions";

function localInputValue() { const d=new Date(); const off=d.getTimezoneOffset(); return new Date(d.getTime()-off*60000).toISOString().slice(0,16); }

export default async function NewObservationPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <AppShell active="Fields"><div className="topbar"><div><h1>Add observation</h1><p className="subtle">Use observations for an agronomic response, condition, or follow-up you may want to compare later.</p></div></div>
    <form action={createObservation} className="card form-card"><input type="hidden" name="field_id" value={id}/>
      <div className="form-grid">
        <label><span>Date & time</span><input type="datetime-local" name="observed_at" defaultValue={localInputValue()}/></label>
        <label><span>Observation type</span><select name="observation_type" defaultValue="Field observation"><option>Field observation</option><option>Treatment follow-up</option><option>Crop response</option><option>Pest pressure</option><option>Disease pressure</option><option>Irrigation / water</option><option>Nutrition</option><option>Harvest / quality</option></select></label>
        <label><span>Rating (optional)</span><input name="rating" inputMode="decimal" placeholder="1–10 or another numeric score"/></label>
      </div>
      <label><span>Observation *</span><textarea name="note" rows={8} required placeholder="Example: 13 days after treatment, mites are nearly cleaned up except along the west dirt road. No visible phytotoxicity."/></label>
      <div className="form-actions"><a className="btn secondary" href={`/fields/${id}`}>Cancel</a><button className="btn" type="submit">Save observation</button></div>
    </form>
  </AppShell>;
}
