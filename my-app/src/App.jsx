import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Analisis from "./components/Analisis";
import Historial from "./components/Historial";
import Header from "./components/Header";
import UserManagement from "./components/UserManagement"; // corregido aquí

const API_BASE = "http://localhost:5000"; // Cambia según tu backend

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("All fields are required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      onLogin(data.user);
    } catch {
      setError("Error connecting to server");
    }
  };

  return (
    <div style={formContainerStyle}>
      <h2 style={titleStyle}>Login</h2>
      {error && <p style={errorStyle}>{error}</p>}
      <form onSubmit={handleLogin} style={formStyle}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>Login</button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
}

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!username || !email || !password || !password2) {
      setError("All fields are required");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role: "user" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      setSuccess("User registered successfully, you can login now.");
      setUsername("");
      setEmail("");
      setPassword("");
      setPassword2("");
    } catch {
      setError("Error connecting to server");
    }
  };

  return (
    <div style={formContainerStyle}>
      <h2 style={titleStyle}>Register</h2>
      {error && <p style={errorStyle}>{error}</p>}
      {success && <p style={successStyle}>{success}</p>}
      <form onSubmit={handleRegister} style={formStyle}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Repeat Password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>Register</button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );
}

// Protege rutas para usuarios logueados
function ProtectedRoute({ user, children }) {
  return user ? children : <Navigate to="/login" />;
}

// Protege rutas solo para admin
function AdminRoute({ user, children }) {
  return user && user.role === "admin" ? children : <Navigate to="/" />;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  if (loading) return null;

  return (
    <Router>
      {user && <Header user={user} onLogout={handleLogout} />}
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <Register />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute user={user}>
              <Analisis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/historial"
          element={
            <AdminRoute user={user}>
              <Historial />
            </AdminRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute user={user}>
              <UserManagement />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}

// Estilos inline para los formularios
const formContainerStyle = {
  maxWidth: 400,
  margin: "5rem auto",
  padding: "2rem",
  boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
  borderRadius: 8,
  textAlign: "center",
  backgroundColor: "#fff",
};

const titleStyle = {
  marginBottom: "1.5rem",
  color: "#351c53",
};

const errorStyle = {
  color: "red",
  fontWeight: "600",
  marginBottom: "1rem",
};

const successStyle = {
  color: "green",
  fontWeight: "600",
  marginBottom: "1rem",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const inputStyle = {
  padding: "0.7rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  outline: "none",
};

const buttonStyle = {
  backgroundColor: "#6943a9",
  color: "#fff",
  padding: "0.7rem",
  borderRadius: "6px",
  border: "none",
  fontWeight: "bold",
  fontSize: "1rem",
  cursor: "pointer",
  boxShadow: "0 3px 8px rgba(105, 67, 169, 0.6)",
  transition: "background-color 0.3s ease",
};

export default App;
