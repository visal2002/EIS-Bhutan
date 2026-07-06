// frontend/src/components/common/Logo.jsx
import { useState } from "react";

/**
 * Logo image with graceful emoji fallback.
 * Props:
 *   src          — image path e.g. "/images/gov_logo.png"
 *   alt          — alt text
 *   size         — number (px), default 64
 *   fallback     — emoji shown if image fails, default "🐉"
 *   className    — optional CSS class on the img/fallback div
 *   style        — optional inline style
 */
export default function Logo({ src, alt = "", size = 64, fallback = "🐉", className = "", style = {} }) {
  const [err, setErr] = useState(false);

  if (err) {
    return (
      <div
        className={className}
        style={{
          width: size, height: size,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.45,
          flexShrink: 0,
          ...style,
        }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErr(true)}
      className={className}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, ...style }}
    />
  );
}