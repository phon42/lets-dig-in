import Art from "./Art";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { art: "size-12", text: "text-3xl" },
  md: { art: "size-20", text: "text-5xl" },
  lg: { art: "size-36 sm:size-44", text: "text-6xl sm:text-7xl" },
};

export default function Logo({ size = "md" }: LogoProps) {
  const s = SIZES[size];
  return (
    <div className={`flex items-center ${size === "lg" ? "flex-col gap-1" : "gap-3"}`}>
      <Art name="logo-emblem" fallback="🍟" className={`${s.art} drop-shadow-[4px_4px_0_rgba(0,0,0,0.35)] text-5xl`} />
      <h1 className={`display-outline ${s.text} leading-[0.9] tracking-wide text-center`}>
        <span className="text-mustard">Phish</span>
        <span className="text-ketchup mx-[0.12em]">&amp;</span>
        <span className="text-paper">Chips</span>
      </h1>
    </div>
  );
}
