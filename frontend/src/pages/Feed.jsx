import { useEffect, useState } from "react";
import api from "../apiClient";
import PostForm from "../components/PostForm";
import PostList from "../components/PostList";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";

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
  toggleRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
  },
  toggleBtn: {
    flex: 1,
    padding: "6px 0",
    borderRadius: "20px",
    border: "1px solid #333",
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
