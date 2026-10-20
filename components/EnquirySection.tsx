"use client";
import { useState } from "react";
import EnquiryForm from "@/components/EnquiryForm";

type Props = { placeId: string; title: string; page: string };

export default function EnquirySection({ placeId, title, page }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="enquiry-section">
      <button className="go" onClick={() => setOpen(!open)} style={{ width: "auto", padding: "12px 24px", fontSize: "1rem", marginBottom: 12 }}>
        {open ? "Hide enquiry form" : "Plan a trip &amp; ask a question"}
      </button>
      {open && (
        <div className="enquiry-full">
          <EnquiryForm placeId={placeId} title={title} page={page} />
        </div>
      )}
    </div>
  );
}
