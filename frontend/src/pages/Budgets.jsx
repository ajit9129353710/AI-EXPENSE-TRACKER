
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const CATEGORIES = [
"Food",
"Salary",
"Shopping",
"Travel",
"Bills",
"Education",
"Health",
"Entertainment",
"Business",
"Other",
];

const MONTHS = [
"January",
"February",
"March",
"April",
"May",
"June",
"July",
"August",
"September",
"October",
"November",
"December",
];

function money(value) {
return new Intl.NumberFormat("en-IN", {
style: "currency",
currency: "INR",
maximumFractionDigits: 2,
}).format(Number(value) || 0);
}

export default function Budgets() {
const now = new Date();

const [month, setMonth] = useState(now.getMonth() + 1);
const [year, setYear] = useState(now.getFullYear());

const [budgets, setBudgets] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [message, setMessage] = useState("");
const [editingId, setEditingId] = useState(null);

const [form, setForm] = useState({
name: "",
category: "Food",
amount: "",
alertAt: 80,
});

const loadBudgets = useCallback(async () => {
setError("");

try {
  const response = await api.get("/budgets", {
    params: { month, year },
  });

  setBudgets(response.data.budgets || []);
} catch (err) {
  setError(
    err.response?.data?.message ||
      "Budgets load nahi hue. Backend check karein."
  );
} finally {
  setLoading(false);
}

}, [month, year]);

useEffect(() => {
loadBudgets();
}, [loadBudgets]);

function resetForm() {
setForm({
name: "",
category: "Food",
amount: "",
alertAt: 80,
});

setEditingId(null);

}

async function handleSubmit(event) {
event.preventDefault();
setError("");
setMessage("");

try {
  const payload = {
    ...form,
    amount: Number(form.amount),
    month: Number(month),
    year: Number(year),
    alertAt: Number(form.alertAt),
  };

  if (!payload.name.trim() || payload.amount <= 0) {
    setError("Budget name aur valid amount enter karein.");
    return;
  }

  if (editingId) {
    await api.put(`/budgets/${editingId}`, payload);
    setMessage("Budget successfully update ho gaya.");
  } else {
    await api.post("/budgets", payload);
    setMessage("Budget successfully create ho gaya.");
  }

  resetForm();
  await loadBudgets();
} catch (err) {
  setError(
    err.response?.data?.message ||
      "Budget save nahi hua."
  );
}

}

function handleEdit(budget) {
setEditingId(budget._id);

setForm({
  name: budget.name,
  category: budget.category,
  amount: String(budget.amount),
  alertAt: budget.alertAt || 80,
});

window.scrollTo({
  top: 0,
  behavior: "smooth",
});

}

async function handleDelete(id) {
if (!window.confirm("Kya aap ye Budget delete karna chahte hain?")) {
return;
}

setError("");
setMessage("");

try {
  await api.delete(`/budgets/${id}`);

  if (editingId === id) {
    resetForm();
  }

  setMessage("Budget delete ho gaya.");
  await loadBudgets();
} catch (err) {
  setError(
    err.response?.data?.message ||
      "Budget delete nahi hua."
  );
}

}

const totalBudget = budgets.reduce(
(sum, item) => sum + Number(item.amount || 0),
0
);

const totalSpent = budgets.reduce(
(sum, item) => sum + Number(item.spent || 0),
0
);

const totalRemaining = budgets.reduce(
(sum, item) => sum + Number(item.remaining || 0),
0
);

if (loading) {
return <main className="container loading">Loading budgets...</main>;
}

return (
<main className="container dashboard">
<div className="dashboard-header">
<div>
<h1 className="dashboard-title">Budget Management</h1>
<p className="muted">
Apna monthly aur category-wise budget manage karein.
</p>
</div>

    <button className="btn" onClick={loadBudgets} type="button">
      Refresh
    </button>
  </div>

  {error && (
    <div className="error-message" role="alert">
      {error}
    </div>
  )}

  {message && (
    <div
      role="status"
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
        background: "rgba(74, 222, 128, 0.12)",
        color: "#4ade80",
      }}
    >
      {message}
    </div>
  )}

  <section className="dashboard-grid">
    <div className="glass-card">
      <h2 className="section-title">
        {editingId ? "Update Budget" : "Create Budget"}
      </h2>

      <form onSubmit={handleSubmit}>
        <label className="label">Budget Name</label>
        <input
          className="input"
          placeholder="e.g. Monthly Food Budget"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          maxLength={100}
          required
        />

        <label className="label">Category</label>
        <select
          className="select"
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <label className="label">Monthly Limit (₹)</label>
        <input
          className="input"
          type="number"
          min="1"
          step="0.01"
          placeholder="5000"
          value={form.amount}
          onChange={(e) =>
            setForm({ ...form, amount: e.target.value })
          }
          required
        />

        <label className="label">Alert Percentage (%)</label>
        <input
          className="input"
          type="number"
          min="1"
          max="100"
          value={form.alertAt}
          onChange={(e) =>
            setForm({ ...form, alertAt: e.target.value })
          }
          required
        />

        <label className="label">Month</label>
        <select
          className="select"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>

        <label className="label">Year</label>
        <input
          className="input"
          type="number"
          min="2000"
          max="2100"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          required
        />

        <button className="btn" type="submit">
          {editingId ? "Update Budget" : "Save Budget"}
        </button>

        {editingId && (
          <button
            className="btn"
            type="button"
            onClick={resetForm}
            style={{ marginLeft: 8 }}
          >
            Cancel
          </button>
        )}
      </form>
    </div>

    <div className="glass-card">
      <h2 className="section-title">
        {MONTHS[month - 1]} {year} Summary
      </h2>

      <p>Total Budget</p>
      <h2>{money(totalBudget)}</h2>

      <p>Total Spent</p>
      <h2>{money(totalSpent)}</h2>

      <p>Remaining Within Budgets</p>
      <h2>{money(totalRemaining)}</h2>

      <p className="muted">
        Summary sirf un categories ke budgets ko include karti hai
        jinke liye aapne budget banaya hai.
      </p>
    </div>
  </section>

  <section className="glass-card" style={{ marginTop: 22 }}>
    <h2 className="section-title">Your Budgets</h2>

    {budgets.length === 0 ? (
      <div className="empty-state">
        Is month ke liye abhi koi Budget nahi hai.
        Upar form se apna pehla Budget banayein.
      </div>
    ) : (
      <div className="budget-list">
        {budgets.map((budget) => {
          const percentage = Number(budget.percentage || 0);
          const progress = Math.min(percentage, 100);

          let color = "#4ade80";
          let statusText = "Budget safe hai";

          if (budget.status === "warning") {
            color = "#fbbf24";
            statusText = "Budget warning!";
          }

          if (budget.status === "exceeded") {
            color = "#fb7185";
            statusText = "Budget exceeded!";
          }

          return (
            <article
              key={budget._id}
              className="glass-card"
              style={{ marginBottom: 16 }}
            >
              <div className="dashboard-header">
                <div>
                  <h3>{budget.name}</h3>
                  <p className="muted">{budget.category}</p>
                </div>

                <strong style={{ color }}>
                  {statusText}
                </strong>
              </div>

              <div
                style={{
                  width: "100%",
                  height: 10,
                  background: "rgba(148, 163, 184, 0.2)",
                  borderRadius: 20,
                  overflow: "hidden",
                  margin: "16px 0",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: color,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              <p>
                Spent: <strong>{money(budget.spent)}</strong>
              </p>

              <p>
                Budget: <strong>{money(budget.amount)}</strong>
              </p>

              <p>
                Remaining:{" "}
                <strong>
                  {money(Number(budget.amount) - Number(budget.spent))}
                </strong>
              </p>

              <p>
                Used: <strong>{percentage.toFixed(1)}%</strong>
              </p>

              {budget.status === "warning" && (
                <p style={{ color: "#fbbf24" }}>
                  Warning: Aapka budget limit ke kareeb hai.
                </p>
              )}

              {budget.status === "exceeded" && (
                <p style={{ color: "#fb7185" }}>
                  Alert: Aapne budget se{" "}
                  {money(Number(budget.spent) - Number(budget.amount))}{" "}
                  zyada kharch kiya hai.
                </p>
              )}

              <button
                className="btn"
                type="button"
                onClick={() => handleEdit(budget)}
              >
                Edit
              </button>

              <button
                className="btn"
                type="button"
                onClick={() => handleDelete(budget._id)}
                style={{ marginLeft: 8 }}
              >
                Delete
              </button>
            </article>
          );
        })}
      </div>
    )}
  </section>
</main>

);
}