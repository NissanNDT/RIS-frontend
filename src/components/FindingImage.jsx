import React, { useState, useEffect } from "react";
import { getSignedImageUrl } from "../utils/supabaseStorage";

const FindingImage = ({ path, label }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) {
      setUrl("");
      return;
    }
    setLoading(true);
    getSignedImageUrl(path)
      .then((res) => setUrl(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [path]);

  if (!path) return null;
  if (loading) return <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Cargando...</span>;
  if (!url) return null;

  return (
    <div style={{ marginTop: "6px" }}>
      <a href={url} target="_blank" rel="noopener noreferrer" title={`Ver ${label}`}>
        <img
          src={url}
          alt={label}
          style={{
            width: "55px",
            height: "55px",
            objectFit: "cover",
            borderRadius: "6px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
          }}
        />
      </a>
    </div>
  );
};

export default FindingImage;
