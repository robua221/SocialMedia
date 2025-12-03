import { Link } from "react-router-dom";

export default function AuthHome() {
  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.logo}>InstaClone</h1>
        <p style={styles.text}>Welcome! Choose an option to continue.</p>
        <Link to="/login" style={styles.buttonPrimary}>
          Log In
        </Link>
        <Link to="/register" style={styles.buttonSecondary}>
          Create Account
        </Link>
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
  box: {
    width: "350px",
    padding: "30px",
    background: "#111",
    borderRadius: "12px",
    border: "1px solid #222",
    textAlign: "center",
  },
  logo: {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "20px",
  },
  text: {
    marginBottom: "20px",
    color: "#aaa",
    fontSize: "14px",
  },
  buttonPrimary: {
    display: "block",
    background: "#0095f6",
    color: "#fff",
    padding: "12px",
    borderRadius: "8px",
    fontWeight: "600",
    marginBottom: "12px",
  },
  buttonSecondary: {
    display: "block",
    background: "#333",
    color: "#fff",
    padding: "12px",
    borderRadius: "8px",
    fontWeight: "600",
  },
};
