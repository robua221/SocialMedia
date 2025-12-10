import { useEffect, useState } from "react";
import api from "../apiClient";
import { Link } from "react-router-dom";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${q}`);
        setResults(res.data.users.concat(res.data.posts));
        setOpen(true);
      } catch (err) {
        console.error(err);
      }
    }, 300); // debounce

    return () => clearTimeout(delay);
  }, [q]);

  return (
    <div style={styles.wrapper}>
      <input
        style={styles.input}
        placeholder="Search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q && setOpen(true)}
      />

      {open && results.length > 0 && (
        <div style={styles.dropdown}>
          {results.map((item) => {
            if (item.username) {
              return (
                <Link
                  key={item._id}
                  to={`/profile/${item.username}`}
                  style={styles.row}
                >
                  <div style={styles.avatar}>
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} style={styles.avatarImg} />
                    ) : (
                      item.username[0].toUpperCase()
                    )}
                  </div>
                  <span>{item.username}</span>
                </Link>
              );
            } else {
              return (
                <Link
                  key={item._id}
                  to={`/post/${item._id}`}
                  style={styles.row}
                >
                  <img src={item.imageUrl} style={styles.thumb} />
                  <span>{item.caption?.slice(0, 20)}...</span>
                </Link>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "400px",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    background: "#111",
    border: "1px solid #333",
    color: "white",
  },
  dropdown: {
    position: "absolute",
    top: "44px",
    left: 0,
    width: "100%",
    background: "#000",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "8px",
    zIndex: 50,
    maxHeight: 300,
    overflowY: "auto",
  },
  row: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "8px 6px",
    borderBottom: "1px solid #222",
    color: "white",
    textDecoration: "none",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#333",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 600,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
  },
  thumb: {
    width: 38,
    height: 38,
    objectFit: "cover",
    borderRadius: "6px",
  },
};
