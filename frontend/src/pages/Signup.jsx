import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, UserRound, Mail, LockKeyhole } from "lucide-react";
import api from "../services/api";

export default function Signup() {
const navigate = useNavigate();

const [form, setForm] = useState({
name: "",
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

if (form.password.length < 6) {
  setError("Password kam se kam 6 characters ka hona chahiye.");
  return;
}

setLoading(true);

try {
  const { data } = await api.post("/auth/signup", {
    name: form.name.trim(),
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
      "Signup failed. Email pehle se registered ho sakta hai."
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

    <h1 style={{ marginTop: 25, fontSize: 30 }}>Create Account</h1>

    <p className="muted" style={{ marginTop: 8 }}>
      Apni income aur expenses track karna shuru karein.
    </p>

    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">
          <UserRound size={15} /> Full Name
        </label>
        <input
          className="input"
          id="name"
          name="name"
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={handleChange}
          autoComplete="name"
          required
        />
      </div>

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
          placeholder="Minimum 6 characters"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button className="btn btn-full" disabled={loading}>
        {loading ? "Creating Account..." : "Create Account"}
      </button>
    </form>

    <p className="auth-footer">
      Already registered? <Link to="/login">Login</Link>
    </p>
  </div>
</div>

);
}