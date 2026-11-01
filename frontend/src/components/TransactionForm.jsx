import { useState } from "react";
import { PlusCircle } from "lucide-react";

const initialForm = {
title: "",
amount: "",
type: "expense",
category: "Food",
date: new Date().toISOString().slice(0, 10),
description: "",
};

const categories = [
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

export default function TransactionForm({ onAdd, onUpdate, editing }) {
const [form, setForm] = useState(initialForm);
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

// Editing transaction select karne par form bharna
if (editing && form._editingId !== editing._id) {
setForm({
title: editing.title || "",
amount: String(editing.amount ?? ""),
type: editing.type || "expense",
category: editing.category || "Other",
date: editing.date
? new Date(editing.date).toISOString().slice(0, 10)
: new Date().toISOString().slice(0, 10),
description: editing.description || "",
_editingId: editing._id,
});
}

function handleChange(e) {
setForm({ ...form, [e.target.name]: e.target.value });
}

async function handleSubmit(e) {
e.preventDefault();
setError("");

const amount = Number(form.amount);

if (!Number.isFinite(amount) || amount <= 0) {
  setError("Amount zero se zyada hona chahiye.");
  return;
}

setLoading(true);

const payload = {
  title: form.title.trim(),
  amount,
  type: form.type,
  category: form.category,
  date: form.date,
  description: form.description.trim(),
};

try {
  if (editing && onUpdate) {
    await onUpdate(editing._id, payload);
  } else {
    await onAdd(payload);
  }

  setForm({
    ...initialForm,
    date: new Date().toISOString().slice(0, 10),
  });
  setError("");
} catch (err) {
  setError(err.response?.data?.message || "Transaction save nahi hua.");
} finally {
  setLoading(false);
}

}

function cancelEdit() {
setForm({
...initialForm,
date: new Date().toISOString().slice(0, 10),
});
}

return (
<div className="glass-card">
<h2 className="section-title">
<PlusCircle size={20} style={{ verticalAlign: "middle" }} />{" "}
{editing ? "Edit Transaction" : "Add Transaction"}
</h2>

  <form onSubmit={handleSubmit}>
    <div className="form-grid">
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          className="input"
          id="title"
          name="title"
          placeholder="e.g. Monthly salary"
          value={form.title}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount (₹)</label>
        <input
          className="input"
          id="amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Enter amount"
          value={form.amount}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="type">Transaction Type</label>
        <select
          className="select"
          id="type"
          name="type"
          value={form.type}
          onChange={handleChange}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          className="select"
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="date">Date</label>
        <input
          className="input"
          id="date"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <input
          className="input"
          id="description"
          name="description"
          placeholder="Optional details"
          value={form.description}
          onChange={handleChange}
        />
      </div>
    </div>

    {error && <div className="error-message">{error}</div>}

    <button className="btn btn-full" type="submit" disabled={loading}>
      {loading
        ? "Saving..."
        : editing
          ? "Update Transaction"
          : "Add Transaction"}
    </button>

    {editing && (
      <button
        className="btn btn-full"
        type="button"
        onClick={cancelEdit}
        style={{ background: "#334155", marginTop: 10 }}
      >
        Cancel Edit
      </button>
    )}
  </form>
</div>

);
}