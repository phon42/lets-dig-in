import { useState } from "react";

interface ArtProps {
  name: string; // File in /art without extension
  fallback: string; // Emoji shown if the image is missing
  className?: string;
  alt?: string;
}

/** A generated illustration from /public/art, with an emoji stand-in */
export default function Art({ name, fallback, className = "", alt = "" }: ArtProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span role="img" aria-label={alt} className={`inline-flex items-center justify-center leading-none ${className}`}>
        <span style={{ fontSize: "0.8em" }}>{fallback}</span>
      </span>
    );
  }
  return (
    <img
      src={`/art/${name}.png`}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
      className={`object-contain select-none ${className}`}
    />
  );
}
