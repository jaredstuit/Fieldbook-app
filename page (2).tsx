import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="login-wrap">
      <section className="login-card">
        <div className="brandmark">Fieldbook</div>
        <p className="subtle">Private agronomy records</p>
        <form action={login} className="login-form">
          <label>Email<input name="email" type="email" required autoComplete="email" /></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
          {error ? <div className="login-error">{error}</div> : null}
          <button className="btn" type="submit">Sign in</button>
        </form>
        <p className="subtle" style={{fontSize:12, marginTop:16, marginBottom:0}}>There is intentionally no public sign-up link.</p>
      </section>
    </main>
  );
}
