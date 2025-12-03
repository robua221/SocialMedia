import { useState } from "react";
import api from "../apiClient";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/register", form);
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>InstaClone</h1>

        <form onSubmit={submit} style={styles.form}>
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            style={styles.input}
          />
          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            style={styles.input}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button}>Sign Up</button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Log In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#000",
  },
  card: {
    width: "350px",
    padding: "30px",
    border: "1px solid #222",
    background: "#111",
    borderRadius: "12px",
  },
  logo: {
    textAlign: "center",
    fontSize: "32px",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#000",
    color: "#fff",
  },
  button: {
    padding: "12px",
    background: "#0095f6",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
  switchText: {
    marginTop: "18px",
    textAlign: "center",
    color: "#aaa",
  },
  link: {
    color: "#0095f6",
  },
  error: {
    color: "red",
    fontSize: "14px",
  },
};