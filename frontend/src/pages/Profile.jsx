import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../apiClient";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  const load = async () => {
    try {
      const res = await api.get(`/users/${username}`);
      setProfile(res.data);
      setEditBio(res.data.user.bio || "");
      setEditAvatarUrl(res.data.user.avatarUrl || "");

      const postsRes = await api.get("/posts", {
        params: { authorId: res.data.user._id },
      });
      setPosts(postsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, [username]);

  const toggleFollow = async () => {
    try {
      const res = await api.post(`/users/${profile.user._id}/follow`);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: res.data.following,
              followersCount:
                prev.followersCount + (res.data.following ? 1 : -1),
            }
          : prev
      );
    } catch (err) {
      console.error(err);
    }
  };

  const saveProfile = async () => {
    try {
      const res = await api.patch("/users/me", {
        bio: editBio,
        avatarUrl: editAvatarUrl,
      });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                bio: res.data.bio,
                avatarUrl: res.data.avatarUrl,
              },
            }
          : prev
      );
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return <div>Loading...</div>;

  const { user: profileUser } = profile;
  const isMe = profile.isMe;

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.avatarBig}>
          {profileUser.avatarUrl ? (
            <img
              src={profileUser.avatarUrl}
              style={{ width: "100%", height: "100%", borderRadius: "50%" }}
            />
          ) : (
            profileUser.username[0].toUpperCase()
          )}
        </div>
        <div>
          <div style={styles.usernameRow}>
            <span style={styles.username}>{profileUser.username}</span>
            {isMe ? (
              <button
                style={styles.followBtn}
                onClick={() => setEditing((p) => !p)}
              >
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            ) : (
              <button style={styles.followBtn} onClick={toggleFollow}>
                {profile.isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
          <div style={styles.stats}>
            <span>
              <b>{profile.postCount}</b> posts
            </span>
            <span>
              <b>{profile.followersCount}</b> followers
            </span>
            <span>
              <b>{profile.followingCount}</b> following
            </span>
          </div>

          {!editing && <div style={styles.bio}>{profileUser.bio}</div>}

          {editing && (
            <div style={{ marginTop: 8 }}>
              <input
                placeholder="Avatar URL"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                style={styles.input}
              />
              <textarea
                placeholder="Bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                style={{ ...styles.input, resize: "vertical" }}
              />
              <button style={styles.followBtn} onClick={saveProfile}>
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      <hr style={{ borderColor: "#222", margin: "20px 0" }} />

      <div style={styles.grid}>
        {posts.map((p) => (
          <img key={p._id} src={p.imageUrl} style={styles.gridImage} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    gap: "24px",
    alignItems: "center",
  },
  avatarBig: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "#333",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "32px",
    fontWeight: "700",
    overflow: "hidden",
  },
  usernameRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
  },
  username: {
    fontSize: "20px",
    fontWeight: "600",
  },
  followBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#0095f6",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  stats: {
    display: "flex",
    gap: "16px",
    fontSize: "14px",
    marginBottom: "8px",
  },
  bio: {
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#000",
    color: "#fff",
    marginBottom: "6px",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "4px",
  },
  gridImage: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
  },
};
