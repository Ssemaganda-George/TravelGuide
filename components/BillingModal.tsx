"use client";

import { useState } from "react";
import { updatePartnerBillingAction, bypassPaymentAction } from "@/app/actions/partners";

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData: {
    id: string;
    subscription_status: string;
    subscription_price: number;
    trial_ends_at: string | null;
    featured: boolean;
  };
}

export function BillingModal({ isOpen, onClose, onSubmit, initialData }: BillingModalProps) {
  const [formData, setFormData] = useState({
    id: initialData.id,
    subscription_status: initialData.subscription_status,
    subscription_price: initialData.subscription_price.toString(),
    trial_ends_at: initialData.trial_ends_at ?? "",
    featured: initialData.featured,
  });
  const [bypassLoading, setBypassLoading] = useState(false);
  const [bypassDays, setBypassDays] = useState(30);
  const [bypassActivate, setBypassActivate] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, String(value));
    });
    onSubmit(data);
  };

  const handleBypass = async (e: React.MouseEvent) => {
    e.preventDefault();
    const action = bypassActivate ? "activate" : "deactivate";
    if (!confirm(`${action === "activate" ? "Activate" : "Deactivate"} this partner without payment? This will ${action === "activate" ? `extend their trial by ${bypassDays} days and mark as active` : "set status to trial and clear payment info"}. For demo purposes only.`)) return;
    
    setBypassLoading(true);
    try {
      const fd = new FormData();
      fd.append("id", formData.id);
      fd.append("bypass_days", String(bypassDays));
      fd.append("bypass_activate", String(bypassActivate));
      await bypassPaymentAction(fd);
      onClose();
    } catch (error) {
      console.error("Bypass failed:", error);
      alert("Failed to bypass payment. Please try again.");
    } finally {
      setBypassLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="billing-modal" className="modal" style={{ display: "flex" }} role="dialog" aria-modal="true" aria-labelledby="billing-title" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 id="billing-title">Billing & Subscription</h2>
        <form onSubmit={handleSubmit} className="form" id="billing-form">
          <input type="hidden" name="id" value={formData.id} />
          <div className="row2">
            <div>
              <label htmlFor="sub-status">Subscription Status</label>
              <select id="sub-status" name="subscription_status" value={formData.subscription_status} onChange={handleChange}>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="sub-price">Monthly Price (USD)</label>
              <input id="sub-price" name="subscription_price" type="number" step="0.01" min="0" placeholder="0.00" value={formData.subscription_price} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label htmlFor="trial-end">Trial Ends At</label>
            <input id="trial-end" name="trial_ends_at" type="date" value={formData.trial_ends_at} onChange={handleChange} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                name="featured"
                id="sub-featured"
                checked={formData.featured}
                onChange={handleChange}
              />
              Featured Partner (priority placement)
            </label>
          </div>
          
          {/* Demo Bypass Section */}
          <div style={{ 
            marginTop: 24, 
            padding: 16, 
            background: "#fff8e1", 
            border: "1px solid #FFC107", 
            borderRadius: 8 
          }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: "#F57F17" }}>
              ⚡ Demo Bypass (No Payment)
            </h3>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "end", marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 4, fontWeight: 500 }}>
                  Days to extend trial
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="365" 
                  value={bypassDays} 
                  onChange={(e) => setBypassDays(parseInt(e.target.value) || 30)}
                  className="input" 
                  style={{ width: "100px" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={bypassActivate}
                    onChange={(e) => setBypassActivate(e.target.checked)}
                  />
                  <span style={{ fontSize: "0.9rem" }}>
                    {bypassActivate ? "✅ Activate Partner" : "❌ Deactivate Partner"}
                  </span>
                </label>
              </div>
            </div>
            <button 
              type="button" 
              className="go" 
              style={{ background: "#FFC107", color: "#000" }} 
              onClick={handleBypass} 
              disabled={bypassLoading}
            >
              {bypassLoading ? "Processing..." : `⚡ ${bypassActivate ? "Activate" : "Deactivate"} Without Payment (Demo)`}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button type="button" className="chip" onClick={onClose}>Cancel</button>
            <button type="submit" className="go">Save Billing</button>
          </div>
        </form>
      </div>
    </div>
  );
}