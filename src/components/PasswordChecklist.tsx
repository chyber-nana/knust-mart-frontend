import { Check, Frown, KeyRound, Smile } from "lucide-react";

export function passwordChecks(password: string) {
  const bytes = new TextEncoder().encode(password).length;
  return [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "No more than 72 bytes", passed: bytes <= 72 },
    { label: "A lowercase letter", passed: /[a-z]/.test(password) },
    { label: "An uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "A number", passed: /\d/.test(password) },
    { label: "A symbol", passed: /[^A-Za-z0-9]/.test(password) },
  ];
}

export const isStrongPassword = (password: string) => passwordChecks(password).every((check) => check.passed);

/** Neutral until the person starts typing, then red or green. Colours live in index.css (light and dark). */
export default function PasswordChecklist({ password }: { password: string }) {
  const checks = passwordChecks(password);
  const strong = checks.every((check) => check.passed);
  const state = !password ? "idle" : strong ? "ok" : "bad";
  const title = state === "idle" ? "Choose a strong password" : strong ? "Strong password!" : "Almost there";
  return (
    <div role="status" aria-live="polite" data-state={state} className="pw-panel rounded-xl p-3 transition-colors">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {state === "idle" ? <KeyRound size={18} aria-hidden="true" /> : strong ? <Smile size={19} aria-hidden="true" /> : <Frown size={19} aria-hidden="true" />}
        <span>{title}</span>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        {checks.map(({ label, passed }) => (
          <li key={label} data-pass={passed} className="pw-item flex items-center gap-1.5">
            <Check size={13} aria-hidden="true" className={passed ? "opacity-100" : "opacity-30"} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
