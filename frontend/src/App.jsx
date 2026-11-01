import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Budgets from "./pages/Budgets";

function ProtectedRoute({ children }) {
const token = localStorage.getItem("token");

return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
return (
<Routes>
<Route path="/" element={<Navigate to="/login" replace />} />

  <Route path="/login" element={<Login />} />

  <Route path="/signup" element={<Signup />} />

  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />

  <Route path="*" element={<Navigate to="/login" replace />} />
  <Route path="/budgets" element={<Budgets />} />
</Routes>

);
}