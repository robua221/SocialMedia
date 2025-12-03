import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Feed from "./pages/Feed";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthHome from "./pages/AuthHome";
import Profile from "./pages/Profile";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" />;
}

export default function App() {
  const { user, logout } = useAuth();

  return (
    <div style={styles.appWrapper}>
      {user && (
        <aside style={styles.sidebar}>
          <div style={styles.logo}>InstaClone</div>

          <Link to="/" style={styles.sideItem}>
            🏠 Home
          </Link>
          <Link to="/chat" style={styles.sideItem}>
            💬 Messages
          </Link>
          <Link to={`/profile/${user.username}`} style={styles.sideItem}>
            👤 Profile
          </Link>

          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </aside>
      )}

      <main style={styles.mainContent}>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Feed />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" /> : <Register />}
          />
          <Route
            path="/auth"
            element={user ? <Navigate to="/" /> : <AuthHome />}
          />
          <Route path="*" element={<Navigate to={user ? "/" : "/auth"} />} />
        </Routes>
      </main>
    </div>
  );
}

const styles = {
  appWrapper: {
    display: "flex",
    minHeight: "100vh",
  },
  sidebar: {
    width: "210px",
    borderRight: "1px solid #222",
    padding: "20px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    background: "#000",
  },
  logo: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "25px",
  },
  sideItem: {
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
  },
  logoutBtn: {
    marginTop: "auto",
    padding: "8px",
    borderRadius: "8px",
    background: "#333",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  mainContent: {
    flex: 1,
    padding: "20px",
    maxWidth: "650px",
    margin: "0 auto",
  },
};
