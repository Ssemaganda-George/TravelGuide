"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface DateFilterProps {
  preset: string;
  start?: string;
  end?: string;
  path?: string;
}

export function DateFilter({ preset, start, end, path = "/admin/partners" }: DateFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const presetOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "Last 7 days" },
    { value: "month", label: "Last 30 days" },
    { value: "quarter", label: "Last 90 days" },
    { value: "year", label: "Last 365 days" },
  ];

  const handlePresetChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", value);
    params.delete("start");
    params.delete("end");
    router.push(`${path}?${params.toString()}`);
  };

  const handleDateChange = (field: "start" | "end", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(field, value);
    } else {
      params.delete(field);
    }
    router.push(`${path}?${params.toString()}`);
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <select 
        defaultValue={preset} 
        onChange={(e) => handlePresetChange(e.target.value)}
        className="select"
        style={{ minWidth: 160 }}
      >
        {presetOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        <option value="custom">Custom range…</option>
      </select>
      {preset === "custom" && (
        <>
          <input 
            type="date" 
            defaultValue={start} 
            onChange={(e) => handleDateChange("start", e.target.value)} 
            className="input" 
            style={{ width: 140 }} 
          />
          <span>to</span>
          <input 
            type="date" 
            defaultValue={end} 
            onChange={(e) => handleDateChange("end", e.target.value)} 
            className="input" 
            style={{ width: 140 }} 
          />
        </>
      )}
    </div>
  );
}