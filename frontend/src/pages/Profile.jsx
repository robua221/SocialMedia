import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../apiClient";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");

  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  /* ---------------- LOAD PROFILE ---------------- */
  const load = async () => {
    try {
      const res = await api.get(`/users/${username}`);
      setProfile(res.data);
      setEditBio(res.data.user.bio || "");

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

  /* ---------------- FOLLOW / UNFOLLOW ---------------- */
  const toggleFollow = async () => {
    try {
      const res = await api.post(`/users/${profile.user._id}/follow`);
      setProfile((prev) => ({
        ...prev,
        isFollowing: res.data.following,
        followersCount: prev.followersCount + (res.data.following ? 1 : -1),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- SAVE PROFILE (FILE UPLOAD) ---------------- */
  const saveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("bio", editBio);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await api.patch("/users/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          ...res.data,
        },
      }));

      setEditing(false);
      // setAvatarFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return <div>Loading...</div>;

  const { user: profileUser } = profile;
  const isMe = profile.isMe;

  return (
    <div>
      {/* ---------------- PROFILE HEADER ---------------- */}
      <div style={styles.header}>
        <div style={styles.avatarBig}>
          {profileUser.avatarUrl ? (
            <img src={profileUser.avatarUrl} style={styles.avatarImg} />
          ) : (
            profileUser.username[0].toUpperCase()
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={styles.usernameRow}>
            <span style={styles.username}>{profileUser.username}</span>

            {isMe ? (
              <button
                style={styles.outlineBtn}
                onClick={() => setEditing((p) => !p)}
              >
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            ) : (
              <button style={styles.primaryBtn} onClick={toggleFollow}>
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

          {!editing && profileUser.bio && (
            <div style={styles.bio}>{profileUser.bio}</div>
          )}

          {editing && (
            <div style={{ marginTop: 10 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files[0])}
                style={styles.input}
              />

              <textarea
                placeholder="Bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                style={{ ...styles.input, resize: "vertical" }}
              />

              <button style={styles.primaryBtn} onClick={saveProfile}>
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- TABS ---------------- */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("posts")}
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === "posts" ? "2px solid #fff" : "none",
          }}
        >
          POSTS
        </button>

        <button
          onClick={() => setActiveTab("liked")}
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === "liked" ? "2px solid #fff" : "none",
          }}
        >
          LIKED
        </button>
      </div>

      {/* ---------------- GRID ---------------- */}
      {activeTab === "posts" && (
        <div style={styles.grid}>
          {posts.map((p) => (
            <img key={p._id} src={p.imageUrl} style={styles.gridImage} />
          ))}
        </div>
      )}

      {activeTab === "liked" && (
        <div style={styles.empty}>Liked posts coming soon</div>
      )}
    </div>
  );
}

/* ===================== STYLES ===================== */

const styles = {
  header: {
    display: "flex",
    gap: 28,
    alignItems: "center",
    marginBottom: 30,
  },
  avatarBig: {
    width: 110,
    height: 110,
    borderRadius: "50%",
    background: "#333",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 42,
    fontWeight: 700,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  usernameRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  username: {
    fontSize: 22,
    fontWeight: 600,
  },
  primaryBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    background: "#0095f6",
    color: "#fff",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  },
  outlineBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    background: "transparent",
    color: "#fff",
    border: "1px solid #333",
    cursor: "pointer",
  },
  stats: {
    display: "flex",
    gap: 22,
    fontSize: 14,
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    maxWidth: 400,
  },
  input: {
    width: "100%",
    padding: 8,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#000",
    color: "#fff",
    marginBottom: 6,
  },
  tabs: {
    display: "flex",
    justifyContent: "center",
    gap: 40,
    borderTop: "1px solid #222",
    borderBottom: "1px solid #222",
    marginBottom: 20,
  },
  tabBtn: {
    padding: "12px 0",
    background: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 4,
  },
  gridImage: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
  },
  empty: {
    textAlign: "center",
    color: "#777",
    marginTop: 40,
  },
};
