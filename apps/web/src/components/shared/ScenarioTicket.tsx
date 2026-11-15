import type { PublicScenario } from "@phish/shared";

const CHANNEL_LABEL = { sms: "Text message", email: "Email", push: "App notification", dm: "Direct message" };

interface ScenarioTicketProps {
  scenario: PublicScenario;
  size?: "sm" | "lg";
  className?: string;
}

/** The order ticket: what the scam is about and who it pretends to be from */
export default function ScenarioTicket({ scenario, size = "lg", className = "" }: ScenarioTicketProps) {
  const lg = size === "lg";
  return (
    <div className={`newsprint sticker relative overflow-hidden ${lg ? "p-8" : "p-4"} ${className}`}>
      {/* Torn ticket edge */}
      <div className="absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(90deg,var(--color-ketchup)_0_12px,transparent_12px_20px)]" />
      <div className="flex items-start gap-4">
        <span className={`${lg ? "text-7xl" : "text-4xl"} leading-none`}>{scenario.emoji}</span>
        <div className="min-w-0">
          <p className={`font-display uppercase tracking-wider text-ketchup ${lg ? "text-2xl" : "text-sm"}`}>Order up!</p>
          <h2 className={`font-display leading-[1.05] ${lg ? "text-5xl" : "text-2xl"}`}>{scenario.prompt}</h2>
        </div>
      </div>
      <dl className={`grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 ${lg ? "mt-6 text-xl" : "mt-3 text-sm"}`}>
        <dt className="text-ink/60">Arrives as</dt>
        <dd className="font-semibold">
          {CHANNEL_LABEL[scenario.channel]} from {scenario.brand}
        </dd>
        <dt className="text-ink/60">Real website</dt>
        <dd>
          <span className="font-mono font-bold bg-pea/20 text-pea-dark px-1.5 rounded">{scenario.domain}</span>
        </dd>
      </dl>
    </div>
  );
}
