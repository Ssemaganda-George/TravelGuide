"use client";
import { useState } from "react";
import EnquirySection from "@/components/EnquirySection";

type Props = { placeId: string; title: string; page: string };

export default function EnquiryTrigger({ placeId, title, page }: Props) {
  const [showEnquiry, setShowEnquiry] = useState(false);
  return (
    <div className="enquiry-trigger">
      <button className="go" style={{ width: "auto", padding: "12px 24px", fontSize: "1rem" }} onClick={() => setShowEnquiry(!showEnquiry)}>
        {showEnquiry ? "Hide enquiry form" : "Ask about this trip"}
      </button>
      {showEnquiry && (
        <div className="enquiry-full">
          <EnquirySection placeId={placeId} title={title} page={page} />
        </div>
      )}
    </div>
  );
}