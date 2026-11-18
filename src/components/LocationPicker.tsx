import { useState } from "react";
import { HALLS, HOSTELS } from "../api";

const OTHER = "__other__";
const CAMPUS = [...HALLS, ...HOSTELS];

export default function LocationPicker({
  value, onChange, placeholder = "Choose a hall or hostel", required = false,
  selectClass = "input", inputClass,
}: {
  value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean;
  selectClass?: string; inputClass?: string;
}) {
  const known = CAMPUS.includes(value);
  const [other, setOther] = useState(!!value && !known);
  const showOther = !known && (other || !!value);
  const choose = (next: string) => {
    if (next === OTHER) { setOther(true); if (known) onChange(""); return; }
    setOther(false); onChange(next);
  };
  return (
    <div className="space-y-2">
      <select aria-label="Location" className={selectClass} value={known ? value : showOther ? OTHER : ""} onChange={(e) => choose(e.target.value)} required={required && !showOther}>
        <option value="">{placeholder}</option>
        <optgroup label="Halls">{HALLS.map((x) => <option key={x}>{x}</option>)}</optgroup>
        <optgroup label="Hostels">{HOSTELS.map((x) => <option key={x}>{x}</option>)}</optgroup>
        <option value={OTHER}>Other / off campus…</option>
      </select>
      {showOther && (
        <input aria-label="Type your location" className={inputClass ?? selectClass} placeholder="Type the place (e.g. Ayeduase, Kentinkrono)" maxLength={80} value={known ? "" : value} onChange={(e) => onChange(e.target.value)} required={required} autoFocus={!value} />
      )}
    </div>
  );
}