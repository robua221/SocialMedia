import { useEffect, useState } from "react";
import api from "../apiClient";
import PostForm from "../components/PostForm";
import PostList from "../components/PostList";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";

function StoriesBar({ username }) {
  const stories = [
    { id: "me", username: username || "you" },
    { id: "alice", username: "alice" },
    { id: "bob", username: "bob" },
    { id: "charlie", username: "charlie" },
    { id: "david", username: "david" },
  ];

  return (
    <div style={styles.stories}>
      {stories.map((s) => (
        <div key={s.id} style={styles.storyItem}>
          <div style={styles.storyRing}>
            <div style={styles.storyAvatar}>{s.username[0].toUpperCase()}</div>
          </div>
          <span style={styles.storyText}>{s.username}</span>
        </div>
      ))}
    </div>
  );
}

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const { user } = useAuth();

  const loadPosts = async (followingOnly) => {
    try {
      const params = followingOnly ? { followingOnly: true } : {};
      const res = await api.get("/posts", { params });
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPosts(showFollowingOnly);
  }, [showFollowingOnly]);

  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.emit("join", user.id);

    socket.on("new-post", (post) => {
      setPosts((prev) => [post, ...prev]);
    });

    socket.on("post-liked", (updated) => {
      setPosts((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
    });

    socket.on("post-commented", (updated) => {
      setPosts((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
    });

    return () => {
      socket.off("new-post");
      socket.off("post-liked");
      socket.off("post-commented");
      socket.disconnect();
    };
  }, [user]);

  return (
    <div>
      <StoriesBar username={user?.username} />

      {/* Toggle: All / Following */}
      <div style={styles.toggleRow}>
        <button
          onClick={() => setShowFollowingOnly(false)}
          style={{
            ...styles.toggleBtn,
            ...(showFollowingOnly ? {} : styles.toggleBtnActive),
          }}
        >
          All
        </button>
        <button
          onClick={() => setShowFollowingOnly(true)}
          style={{
            ...styles.toggleBtn,
            ...(showFollowingOnly ? styles.toggleBtnActive : {}),
          }}
        >
          Following
        </button>
      </div>

      <PostForm onNewPost={(p) => setPosts((prev) => [p, ...prev])} />
      <PostList posts={posts} />
    </div>
  );
}

const styles = {
  stories: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
    paddingBottom: "8px",
    overflowX: "auto",
    borderBottom: "1px solid #222",
  },
  storyItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: 11,
  },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    padding: 2,
    background:
      "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285aeb 90%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  storyAvatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #000",
    fontWeight: 600,
  },
  storyText: {
    color: "#ccc",
  },
  toggleRow: {
    display: "flex",
    gap: "8px",
    margin: "12px 0",
  },
  toggleBtn: {
    flex: 1,
    padding: "6px 0",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#333",
    borderRadius: "20px",
    background: "#000",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
  },

  toggleBtnActive: {
    background: "#fff",
    color: "#000",
    borderColor: "#fff",
  },
};
