import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

function formatCurrency(amount) {
return new Intl.NumberFormat("en-IN", {
style: "currency",
currency: "INR",
maximumFractionDigits: 2,
}).format(Number(amount) || 0);
}

export default function Summary({ summary = {} }) {
const income = Number(summary.totalIncome ?? summary.income ?? 0);
const expense = Number(summary.totalExpense ?? summary.expense ?? 0);
const balance = Number(summary.balance ?? income - expense);

const cards = [
{
title: "Total Income",
amount: income,
icon: TrendingUp,
color: "income-color",
},
{
title: "Total Expenses",
amount: expense,
icon: TrendingDown,
color: "expense-color",
},
{
title: "Available Balance",
amount: balance,
icon: Wallet,
color: "balance-color",
},
];

return (
<div className="summary-grid">
{cards.map((card) => {
const Icon = card.icon;

    return (
      <div className="glass-card summary-card" key={card.title}>
        <h3>
          <Icon size={17} style={{ verticalAlign: "middle" }} />{" "}
          {card.title}
        </h3>

        <div className={`summary-amount ${card.color}`}>
          {formatCurrency(card.amount)}
        </div>
      </div>
    );
  })}
</div>

);
}