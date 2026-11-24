'use client';
import { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useActionState } from 'react';
import { submitEnquiry, type FormState } from '@/app/actions';
import { useDialog } from '@/components/DialogContext';

const INTERESTS = ["gorillas","chimpanzee","wildlife", "adventure", "culture", "relaxing", "birds", "food"];

export default function QuickEnquiryDialog() {
  const [state, formAction, isSubmitting] = useActionState<FormState, FormData>(submitEnquiry, null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pathname = usePathname();
  const { close } = useDialog();

  const closeDialog = () => {
    close();
    formRef.current?.reset();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDialog();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (state?.ok) {
    return (
      <div
        ref={dialogRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={closeDialog}
      >
        <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6 relative max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={closeDialog}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <h3 className="text-xl font-semibold mb-4">Enquiry sent</h3>
          <p className="text-green-600 text-sm mb-6">{state.msg}</p>
          <div className="flex justify-end">
            <Button type="button" onClick={closeDialog} className="text-sm">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={closeDialog}
    >
      <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6 relative max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={closeDialog}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-xl font-semibold mb-4">Plan my trip</h3>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="placeId" value="" />
          <input type="hidden" name="page" value={pathname} />
          <div>
            <label className="block text-sm font-medium">Your name</label>
            <input type="text" name="name" required className="mt-1 w-full rounded border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">How should I reply?</label>
            <select name="method" className="mt-1 w-full rounded border p-2">
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">WhatsApp number or email</label>
            <input type="tel" name="contact" required className="mt-1 w-full rounded border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Travel dates (or "not sure yet")</label>
            <input type="date" name="dates" className="mt-1 w-full rounded border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Days</label>
            <select name="days" className="mt-1 w-full rounded border p-2">
              <option value="">Not sure</option>
              <option value="2-5">2–5 days</option>
              <option value="5-10">5–10 days</option>
              <option value="10-20">10–20 days</option>
              <option value="20-plus">20+ days</option>
            </select>
          </div>
          <div className="row">
            <div>
              <label className="block text-sm font-medium">Travellers</label>
              <input type="number" name="group" min="1" defaultValue="2" className="mt-1 w-full rounded border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Budget per person (optional)</label>
              <select name="budget" className="mt-1 w-full rounded border p-2">
                <option value="">Not sure</option>
                <option value="under-50">Under $50</option>
                <option value="50-100">$50–$100</option>
                <option value="100-200">$100–$200</option>
                <option value="200-500">$200–$500</option>
                <option value="over-500">Over $500</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Interests (optional)</label>
            <div className="interests mt-2 grid grid-cols-2 gap-2">
              {INTERESTS.map(interest => (
                <label key={interest} className="interests-label flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="interests" value={interest} className="rounded border border-gray-300 text-yellow-600 focus:ring-0" />
                  {interest}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Anything else I should know?</label>
            <textarea name="message" rows={3} className="mt-1 w-full rounded border p-2" />
          </div>
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <div className="flex justify-end">
            <Button type="button" onClick={closeDialog} className="mr-2 text-sm">
              Cancel
            </Button>
            <Button type="submit" className="text-sm" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send enquiry'}
            </Button>
          </div>
          {state && !state.ok && <p className="msg text-red-600 text-sm">{state.msg}</p>}
        </form>
      </div>
    </div>
  );
}