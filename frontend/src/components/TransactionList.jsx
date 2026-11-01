import { Pencil, Trash2, ReceiptText } from "lucide-react";

function formatCurrency(amount) {
return new Intl.NumberFormat("en-IN", {
style: "currency",
currency: "INR",
maximumFractionDigits: 2,
}).format(Number(amount) || 0);
}

export default function TransactionList({
transactions = [],
onEdit,
onDelete,
deletingId,
}) {
return (
<div className="glass-card">
<h2 className="section-title">
<ReceiptText size={20} style={{ verticalAlign: "middle" }} />{" "}
Recent Transactions
</h2>

  {transactions.length === 0 ? (
    <div className="empty-state">
      <ReceiptText size={36} />
      <p style={{ marginTop: 12 }}>Abhi koi transaction nahi hai.</p>
      <p style={{ marginTop: 6, fontSize: 13 }}>
        Apni pehli income ya expense add karein.
      </p>
    </div>
  ) : (
    <div className="transaction-list">
      {transactions.map((transaction) => (
        <div className="transaction-item" key={transaction._id}>
          <div className="transaction-info">
            <h4>{transaction.title}</h4>
            <p>
              {transaction.category || "Other"} ·{" "}
              {transaction.date
                ? new Date(transaction.date).toLocaleDateString("en-IN")
                : "No date"}
            </p>

            {transaction.description && (
              <p style={{ marginTop: 5 }}>{transaction.description}</p>
            )}
          </div>

          <div className="transaction-actions">
            <strong
              className={
                transaction.type === "income"
                  ? "income-color"
                  : "expense-color"
              }
            >
              {transaction.type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </strong>

            <button
              className="icon-btn"
              onClick={() => onEdit(transaction)}
              title="Edit"
              aria-label={`Edit ${transaction.title}`}
            >
              <Pencil size={16} />
            </button>

            <button
              className="icon-btn delete-btn"
              onClick={() => onDelete(transaction._id)}
              disabled={deletingId === transaction._id}
              title="Delete"
              aria-label={`Delete ${transaction.title}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

);
}