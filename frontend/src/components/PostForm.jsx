import { useState } from "react";
import api from "../apiClient";
import { socket } from "../socket";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function PostForm({ onNewPost }) {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setImageUrl("");
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    handleFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const uploadToCloudinary = async () => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !imageUrl.trim()) return;

    try {
      setLoading(true);
      let finalUrl = imageUrl.trim();

      if (file) {
        const uploaded = await uploadToCloudinary();
        finalUrl = uploaded;
      }

      const res = await api.post("/posts", {
        imageUrl: finalUrl,
        caption,
      });

      onNewPost(res.data);
      socket.emit("new-post", res.data);

      setCaption("");
      setImageUrl("");
      setFile(null);
      setPreview("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form style={styles.box} onSubmit={handleSubmit}>
      <div
        style={styles.dropZone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <p style={{ fontSize: 13, color: "#aaa", marginBottom: 6 }}>
          Drag & drop an image here, or click to select
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={styles.fileInput}
        />
      </div>

      <input
        placeholder="Or paste image URL"
        value={imageUrl}
        onChange={(e) => {
          setImageUrl(e.target.value);
          if (e.target.value) {
            setFile(null);
            setPreview("");
          }
        }}
        style={styles.input}
      />
      <input
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={styles.input}
      />

      {preview && (
        <img
          src={preview}
          style={{
            width: "100%",
            maxHeight: 200,
            objectFit: "cover",
            borderRadius: 8,
            marginBottom: 8,
          }}
        />
      )}

      <button type="submit" style={styles.btn} disabled={loading}>
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
}

const styles = {
  box: {
    border: "1px solid #222",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
    background: "#111",
  },
  dropZone: {
    border: "1px dashed #444",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "8px",
    textAlign: "center",
    cursor: "pointer",
    position: "relative",
  },
  fileInput: {
    position: "absolute",
    inset: 0,
    opacity: 0,
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #333",
    marginBottom: "8px",
    background: "#000",
    color: "#fff",
  },
  btn: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: "#0095f6",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
};
