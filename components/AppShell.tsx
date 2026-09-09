import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function AppShell({ children, active = "Growers" }: { children: React.ReactNode; active?: string }) {
  const items = [
    {label:"Growers",href:"/"},
    {label:"Fields",href:"/fields"},
    {label:"Samples",href:"/samples"},
    {label:"Recommendations",href:"#"},
    {label:"Tasks",href:"#"}
  ];
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand">Fieldbook<small>PRIVATE AGRONOMY</small></div>
      <nav className="nav">
        {items.map(item => item.href === "#"
          ? <span key={item.label} className={active===item.label?"active":""} style={{display:"block",padding:"11px 12px",opacity:.5}}>{item.label}</span>
          : <Link key={item.label} className={active===item.label?"active":""} href={item.href}>{item.label}</Link>)}
      </nav>
      <form action={logout} style={{marginTop:28}}><button className="sidebar-logout" type="submit">Sign out</button></form>
    </aside>
    <main className="main">{children}</main>
  </div>;
}
