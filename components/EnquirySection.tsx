"use client";
import EnquiryForm from "@/components/EnquiryForm";

type Props = { placeId: string; title: string; page: string };

export default function EnquirySection({ placeId, title, page }: Props) {
  return (
    <div className="enquiry-section">
      <div className="enquiry-full">
        <EnquiryForm placeId={placeId} title={title} page={page} />
      </div>
    </div>
  );
}