import { useEffect, useState } from "react";
import api from "../apiClient";
import { useAuth } from "../context/AuthContext";
import { socket } from "../socket";

export default function PostList({ posts }) {
  const [localPosts, setLocalPosts] = useState(posts);

  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  const updatePost = (updated) => {
    setLocalPosts((prev) =>
      prev.map((p) => (p._id === updated._id ? updated : p))
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {localPosts.map((post) => (
        <PostCard key={post._id} post={post} onUpdate={updatePost} />
      ))}
    </div>
  );
}

function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [heartBurst, setHeartBurst] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const hasLiked = post.likes?.some((id) => id === user.id);

  const toggleLike = async (forceLike = false) => {
    // if forceLike is true and already liked, don't unlike
    if (forceLike && hasLiked) return;
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      onUpdate(res.data);
      socket.emit("post-liked", res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDoubleTap = () => {
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 600);
    toggleLike(true);
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/posts/${post._id}/comments`, {
        text: commentText,
      });
      onUpdate(res.data);
      socket.emit("post-commented", res.data);
      setCommentText("");
    } catch (err) {
      console.error(err);
    }
  };

  const lastComments = post.comments?.slice(-2) || [];

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.avatar}>
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              style={{ width: "100%", height: "100%", borderRadius: "50%" }}
            />
          ) : (
            post.author.username[0].toUpperCase()
          )}
        </div>
        <div style={styles.username}>{post.author.username}</div>
      </div>

      <div style={styles.imageWrapper} onDoubleClick={handleDoubleTap}>
        <img src={post.imageUrl} style={styles.image} />
        {heartBurst && <div style={styles.heartOverlay}>❤️</div>}
      </div>

      <div style={styles.actions}>
        <span style={{ cursor: "pointer" }} onClick={() => toggleLike(false)}>
          {hasLiked ? "❤️" : "🤍"}
        </span>
      </div>

      <div style={styles.meta}>
        <div style={styles.likes}>{post.likes?.length || 0} likes</div>
        <div style={styles.caption}>
          <b>{post.author.username}</b> {post.caption}
        </div>

        {post.comments && post.comments.length > 0 && (
          <div style={styles.comments}>
            {lastComments.map((c) => (
              <div key={c._id}>
                <b>{c.author.username}</b> {c.text}
              </div>
            ))}
            {post.comments.length > 2 && (
              <div
                style={{ color: "#aaa", fontSize: 12, cursor: "pointer" }}
                onClick={() => setShowAllComments(true)}
              >
                View all {post.comments.length} comments
              </div>
            )}
          </div>
        )}

        <form onSubmit={addComment} style={styles.commentForm}>
          <input
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={styles.commentInput}
          />
        </form>
      </div>

      {/* Comments modal */}
      {showAllComments && (
        <div
          style={styles.modalBackdrop}
          onClick={() => setShowAllComments(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span>Comments</span>
              <button
                style={styles.modalClose}
                onClick={() => setShowAllComments(false)}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              {post.comments.map((c) => (
                <div key={c._id} style={{ marginBottom: 8 }}>
                  <b>{c.author.username}</b> {c.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #222",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#111",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#333",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "700",
    overflow: "hidden",
  },
  username: {
    fontWeight: "600",
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: "100%",
    maxHeight: "500px",
    objectFit: "cover",
  },
  heartOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "64px",
    opacity: 0.9,
    pointerEvents: "none",
  },
  actions: {
    padding: "8px 12px",
    fontSize: "20px",
  },
  meta: {
    padding: "0 12px 10px",
  },
  likes: {
    fontWeight: "600",
    marginBottom: "4px",
  },
  caption: {
    fontSize: "14px",
    marginBottom: "6px",
  },
  comments: {
    fontSize: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    marginBottom: "4px",
  },
  commentForm: {
    marginTop: "6px",
  },
  commentInput: {
    width: "100%",
    border: "none",
    borderTop: "1px solid #333",
    padding: "6px 0",
    background: "transparent",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    width: "90%",
    maxWidth: "400px",
    maxHeight: "60vh",
    background: "#111",
    borderRadius: "12px",
    border: "1px solid #333",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    padding: "10px 12px",
    borderBottom: "1px solid #333",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalClose: {
    background: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  modalBody: {
    padding: "10px 12px",
    overflowY: "auto",
  },
};
