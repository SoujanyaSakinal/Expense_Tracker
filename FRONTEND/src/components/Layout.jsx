import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, Receipt, PieChart, LogOut, TrendingUp, Shield } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

function getNavItems(isAdmin) {
  if (isAdmin) {
    return [{ to: "/admin", label: "Admin", icon: Shield, end: true }];
  }
  return [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/expenses", label: "Expenses", icon: Receipt },
    { to: "/reports", label: "Reports", icon: PieChart },
    { to: "/analytics", label: "Analytics", icon: TrendingUp },
  ];
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = getNavItems(user?.is_admin);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-line bg-paper-card">
        <div className="px-6 py-6 flex items-center gap-2 border-b border-line">
          <BookOpen size={22} className="text-emerald shrink-0" strokeWidth={1.75} />
          <div>
            <h1 className="font-display text-xl leading-tight text-ink">Ledger</h1>
            <p className="text-xs text-ink-soft tracking-wide">Expense Tracker</p>
          </div>
        </div>

        <nav className="flex md:flex-col gap-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald text-paper-card"
                    : "text-ink-soft hover:bg-line-soft hover:text-ink"
                }`
              }
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex flex-col gap-3 px-6 py-4 mt-auto border-t border-line">
          <p className="text-sm font-medium text-ink">{user?.name || user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-ink-soft hover:text-rust w-fit"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}