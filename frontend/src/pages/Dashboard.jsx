import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { RefreshCw, Sparkles } from "lucide-react";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Summary from "../components/Summary";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import AIChat from "../components/AIChat";

const COLORS = ["#38bdf8", "#fb7185", "#4ade80", "#a78bfa", "#fbbf24"];

function getSummaryValues(data = {}) {
  const income = Number(data.totalIncome ?? data.income ?? 0);
  const expense = Number(data.totalExpense ?? data.expense ?? 0);

  return {
    ...data,
    totalIncome: income,
    totalExpense: expense,
    balance: Number(data.balance ?? income - expense),
  };
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  const [filters, setFilters] = useState({
    type: "",
    category: "",
    search: "",
  });

  const loadDashboard = useCallback(async () => {
    setError("");

    try {
      const params = {};

      if (filters.type) {
        params.type = filters.type;
      }

      if (filters.category) {
        params.category = filters.category;
      }

      if (filters.search.trim()) {
        params.search = filters.search.trim();
      }

      const [transactionResponse, summaryResponse] = await Promise.all([
        api.get("/transactions", { params }),
        api.get("/transactions/summary"),
      ]);

      const transactionData = transactionResponse.data;
      const summaryData = summaryResponse.data;

      const transactionList = Array.isArray(transactionData)
        ? transactionData
        : transactionData.transactions || [];

      setTransactions(transactionList);

      setSummary(
        getSummaryValues(summaryData.summary || summaryData)
      );
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

      setError(
        err.response?.data?.message ||
          "Dashboard load nahi hua. Backend server check karein."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleAdd(payload) {
    setError("");
    setSuccess("");

    try {
      await api.post("/transactions", payload);

      setEditing(null);
      setSuccess("Transaction successfully add ho gaya.");

      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Transaction add nahi hua. Details check karein."
      );
      throw err;
    }
  }

  async function handleUpdate(id, payload) {
    setError("");
    setSuccess("");

    try {
      if (!id) {
        throw new Error("Transaction ID nahi mili.");
      }

      await api.put(`/transactions/${id}`, payload);

      setEditing(null);
      setSuccess("Transaction successfully update ho gaya.");

      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Transaction update nahi hua. Dobara try karein."
      );
      throw err;
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Kya aap is transaction ko delete karna chahte hain?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/transactions/${id}`);

      if (editing?._id === id) {
        setEditing(null);
      }

      setSuccess("Transaction successfully delete ho gaya.");

      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Transaction delete nahi hua."
      );
    } finally {
      setDeletingId("");
    }
  }

  const chartData = useMemo(() => {
    const totals = {};

    transactions.forEach((transaction) => {
      if (transaction.type !== "expense") return;

      const category = transaction.category || "Other";
      const amount = Number(transaction.amount) || 0;

      totals[category] = (totals[category] || 0) + amount;
    });

    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [transactions]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container loading">
          Loading your dashboard...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="container dashboard">
        
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              Financial Dashboard
            </h1>

            <p className="muted">
              Apni income, expenses aur balance ko ek jagah manage karein.
            </p>
          </div>

          <button
            className="btn"
            onClick={loadDashboard}
            type="button"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div
            className="success-message"
            role="status"
            style={{
              padding: "12px 16px",
              marginBottom: 16,
              borderRadius: 8,
              background: "rgba(74, 222, 128, 0.12)",
              color: "#4ade80",
            }}
          >
            {success}
          </div>
        )}

        <Summary summary={summary} />
        <div className="dashboard-grid">
          <TransactionForm
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            editing={editing}
          />

          <section className="glass-card">
            <h2 className="section-title">
              Expense Breakdown
            </h2>

            {chartData.length === 0 ? (
              <div className="empty-state">
                Expense add karne par chart yahan dikhega.
              </div>
            ) : (
              <div
                className="chart-container"
                style={{ width: "100%", height: 300 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                      paddingAngle={3}
                      label
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                        }).format(value)
                      }
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>

        <section
          className="glass-card"
          style={{ marginBottom: 22 }}
        >
          <h2 className="section-title">
            Filter Transactions
          </h2>

          <div className="filter-row">
            <input
              className="input"
              placeholder="Search by title..."
              value={filters.search}
              onChange={(e) =>
                setFilters((previous) => ({
                  ...previous,
                  search: e.target.value,
                }))
              }
            />

            <select
              className="select"
              value={filters.type}
              onChange={(e) =>
                setFilters((previous) => ({
                  ...previous,
                  type: e.target.value,
                }))
              }
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select
              className="select"
              value={filters.category}
              onChange={(e) =>
                setFilters((previous) => ({
                  ...previous,
                  category: e.target.value,
                }))
              }
            >
              <option value="">All Categories</option>

              {[
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
              ].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              className="btn"
              type="button"
              onClick={() =>
                setFilters({
                  type: "",
                  category: "",
                  search: "",
                })
              }
            >
              Clear Filters
            </button>
          </div>
        </section>
        <TransactionList
          transactions={transactions}
          onEdit={setEditing}
          onDelete={handleDelete}
          deletingId={deletingId}
        />

        <section
          className="glass-card"
          style={{ marginTop: 28, marginBottom: 30 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <Sparkles size={25} color="#a78bfa" />

            <div>
              <h2 className="section-title" style={{ marginBottom: 4 }}>
                AI Financial Assistant
              </h2>

              <p className="muted">
                Apne income, expenses aur savings ke baare mein AI se poochhein.
              </p>
            </div>
          </div>

          <AIChat
            income={summary.totalIncome}
            expenses={summary.totalExpense}
            balance={summary.balance}
          />
        </section>
      </main>
    </>
  );
}