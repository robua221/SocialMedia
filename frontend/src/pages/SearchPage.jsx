import { useEffect, useState } from "react";
import api from "../apiClient";
import { useSearchParams, Link } from "react-router-dom";

export default function SearchPage() {
  const [results, setResults] = useState([]);
  const [params] = useSearchParams();
  const q = params.get("q");

  useEffect(() => {
    if (!q) return;

    const load = async () => {
      const res = await api.get(`/search?q=${q}`);
      setResults(res.data);
    };

    load();
  }, [q]);

  return (
    <div style={{ color: "white" }}>
      <h2>Search: {q}</h2>

      <h3>Users</h3>
      {results.users?.map((u) => (
        <Link
          key={u._id}
          to={`/profile/${u.username}`}
          style={{ display: "block", padding: "6px 0", color: "white" }}
        >
          {u.username}
        </Link>
      ))}

      <h3>Posts</h3>
      <div style={styles.grid}>
        {results.posts?.map((p) => (
          <Link key={p._id} to={`/post/${p._id}`}>
            <img src={p.imageUrl} style={styles.img} />
          </Link>
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
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
};
