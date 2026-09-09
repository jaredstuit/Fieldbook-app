import AppShell from "@/components/AppShell";
import { createGrower } from "@/app/actions";

export default function NewGrowerPage() {
  return <AppShell><div className="topbar"><div><h1>Add grower</h1><p className="subtle">Create the customer record first. Ranches and fields live underneath it.</p></div></div>
    <form action={createGrower} className="card form-card">
      <div className="form-grid">
        <label><span>Grower / company name *</span><input name="name" required /></label>
        <label><span>Primary contact</span><input name="contact_name" /></label>
        <label><span>Phone</span><input name="phone" /></label>
        <label><span>Email</span><input name="email" type="email" /></label>
      </div>
      <label><span>Notes</span><textarea name="notes" rows={4} /></label>
      <div className="form-actions"><a className="btn secondary" href="/">Cancel</a><button className="btn" type="submit">Save grower</button></div>
    </form>
  </AppShell>;
}
