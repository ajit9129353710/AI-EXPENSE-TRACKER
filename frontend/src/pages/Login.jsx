import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, Mail, LockKeyhole } from "lucide-react";
import api from "../services/api";

export default function Login() {
const navigate = useNavigate();

const [form, setForm] = useState({
email: "",
password: "",
});

const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

function handleChange(e) {
setForm({ ...form, [e.target.name]: e.target.value });
}

async function handleSubmit(e) {
e.preventDefault();
setError("");
setLoading(true);

try {
  const { data } = await api.post("/auth/login", {
    email: form.email.trim(),
    password: form.password,
  });

  localStorage.setItem("token", data.token);

  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  navigate("/dashboard");
} catch (err) {
  setError(
    err.response?.data?.message ||
      "Login failed. Email aur password check karein."
  );
} finally {
  setLoading(false);
}

}

return (
<div className="page-center">
<div className="glass-card auth-card">
<div className="brand">
<Wallet size={28} /> Expense<span>Flow</span>
</div>

    <h1 style={{ marginTop: 25, fontSize: 30 }}>Welcome Back!</h1>

    <p className="muted" style={{ marginTop: 8 }}>
      Login karke apne finances manage karein.
    </p>

    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email">
          <Mail size={15} /> Email Address
        </label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">
          <LockKeyhole size={15} /> Password
        </label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button className="btn btn-full" disabled={loading}>
        {loading ? "Please wait..." : "Login to Dashboard"}
      </button>
    </form>

    <p className="auth-footer">
      Don't have an account? <Link to="/signup">Create Account</Link>
    </p>
  </div>
</div>

);
}