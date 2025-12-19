import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authHeader } from "./AuthContext";
import { socket } from "../socket";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  /* ---------------------------
     LOAD NOTIFICATIONS
  --------------------------- */
  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5001/api/notifications", {
        headers: authHeader(),
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }, []);

  /* ---------------------------
     MARK ALL READ
  --------------------------- */
  const markAllRead = async () => {
    try {
      await fetch("http://localhost:5001/api/notifications/mark-all-read", {
        method: "POST",
        headers: authHeader(),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark notifications read", err);
    }
  };

  /* ---------------------------
     SOCKET REALTIME
  --------------------------- */
  useEffect(() => {
    refreshNotifications();

    socket.on("notify", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => socket.off("notify");
  }, [refreshNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
