import { useNotifications } from "../context/NotificationContext";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { notifications, markAllRead } = useNotifications();

  return (
    <div>
      <div style={styles.header}>
        <h2>Notifications</h2>

        {notifications.length > 0 && notifications.some((n) => !n.isRead) && (
          <button style={styles.markBtn} onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ color: "#aaa", marginTop: 12 }}>
          No notifications yet.
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          {notifications.map((n) => (
            <div
              key={n._id}
              style={{
                ...styles.item,
                background: n.isRead ? "#000" : "#111",
              }}
            >
              <div style={styles.avatar}>
                {n.sender?.avatarUrl ? (
                  <img
                    src={n.sender.avatarUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  n.sender?.username?.[0]?.toUpperCase()
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={styles.text}>{renderText(n)}</div>
                <div style={styles.time}>
                  {formatDistanceToNow(new Date(n.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>

              {n.post?.imageUrl && (
                <img src={n.post.imageUrl} style={styles.thumb} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderText(n) {
  switch (n.type) {
    case "like":
      return (
        <>
          <b>{n.sender?.username}</b> liked your post
        </>
      );
    case "comment":
      return (
        <>
          <b>{n.sender?.username}</b> commented on your post
        </>
      );
    case "follow":
      return (
        <>
          <b>{n.sender?.username}</b> started following you
        </>
      );
    case "message":
      return (
        <>
          <b>{n.sender?.username}</b> sent you a message
        </>
      );
    default:
      return "Notification";
  }
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  markBtn: {
    border: "none",
    borderRadius: 16,
    padding: "6px 10px",
    background: "#333",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px",
    borderRadius: 8,
    marginBottom: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    overflow: "hidden",
  },
  text: {
    fontSize: 14,
  },
  time: {
    fontSize: 12,
    color: "#888",
  },
  thumb: {
    width: 40,
    height: 40,
    objectFit: "cover",
    borderRadius: 6,
  },
};
