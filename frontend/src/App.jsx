import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Feed from "./pages/Feed";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthHome from "./pages/AuthHome";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Notifications from "./pages/Notifications";
import SearchBar from "./components/SearchBar";
import SearchPage from "./pages/SearchPage";
import { useNotifications } from "./context/NotificationContext";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" />;
}

export default function App() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <div style={styles.appWrapper}>
      {user && (
        <aside style={styles.sidebar}>
          <div style={styles.logo}>InstaClone</div>

          <NavLink
            to="/"
            className={({ isActive }) =>
              "side-link" + (isActive ? " side-link-active" : "")
            }
          >
            🏠 Home
          </NavLink>

          <NavLink
            to="/explore"
            className={({ isActive }) =>
              "side-link" + (isActive ? " side-link-active" : "")
            }
          >
            🔍 Explore
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              "side-link" + (isActive ? " side-link-active" : "")
            }
            style={{ position: "relative" }}
          >
            🔔 Notifications
            {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) =>
              "side-link" + (isActive ? " side-link-active" : "")
            }
          >
            💬 Messages
          </NavLink>

          <NavLink
            to={`/profile/${user.username}`}
            className={({ isActive }) =>
              "side-link" + (isActive ? " side-link-active" : "")
            }
          >
            👤 Profile
          </NavLink>

          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </aside>
      )}
      <div style={{ padding: "10px 25px" }}>
        <SearchBar />
      </div>

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
            path="/search"
            element={
              <PrivateRoute>
                <SearchPage />
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
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
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
          <Route
            path="/explore"
            element={
              <PrivateRoute>
                <Explore />
              </PrivateRoute>
            }
          />
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
  badge: {
    position: "absolute",
    top: "-4px",
    right: "-8px",
    background: "red",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "700",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  mainContent: {
    flex: 1,
    padding: "20px",
    maxWidth: "650px",
    margin: "0 auto",
  },
};
