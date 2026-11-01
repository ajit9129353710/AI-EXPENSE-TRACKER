import { Wallet, LogOut, LayoutDashboard, PiggyBank } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
const navigate = useNavigate();

let user = {};

try {
user = JSON.parse(localStorage.getItem("user") || "{}");
} catch {
user = {};
}

function handleLogout() {
localStorage.removeItem("token");
localStorage.removeItem("user");
navigate("/login");
}

return (
<header className="navbar">
<div className="container navbar-inner">
<div
className="brand"
style={{ marginBottom: 0, cursor: "pointer" }}
onClick={() => navigate("/dashboard")}
>
<Wallet size={25} /> Expense<span>Flow</span>
</div>

    <div className="navbar-actions">
      <span className="muted">
        Hi, {user.name || "User"}
      </span>

      <button
        className="btn"
        onClick={() => navigate("/dashboard")}
        type="button"
      >
        <LayoutDashboard size={16} />
        Dashboard
      </button>

      <button
        className="btn"
        onClick={() => navigate("/budgets")}
        type="button"
      >
        <PiggyBank size={16} />
        Budgets
      </button>

      <button
        className="icon-btn"
        onClick={handleLogout}
        title="Logout"
        aria-label="Logout"
        type="button"
      >
        <LogOut size={18} />
      </button>
    </div>
  </div>
</header>

);
}