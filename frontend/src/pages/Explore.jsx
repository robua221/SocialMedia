import { useEffect, useState } from "react";
import api from "../apiClient";

export default function Explore() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/posts/explore");
        setPosts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Explore</h2>
      <div style={styles.grid}>
        {posts.map((p) => (
          <div key={p._id} style={styles.item}>
            <img src={p.imageUrl} style={styles.image} />
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "4px",
  },
  item: {
    width: "100%",
    aspectRatio: "1 / 1",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
};
