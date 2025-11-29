"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Phone, ChevronDown, ChevronUp, Users, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getActiveDonors, type ActiveDonor } from "@/server/actions/donor";
import { useRouter } from "next/navigation";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

interface ActiveDonorsProps {
  className?: string;
}

export function ActiveDonors({ className }: ActiveDonorsProps) {
  const [donors, setDonors] = useState<ActiveDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("");
  const [expandedDonor, setExpandedDonor] = useState<number | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchDonors = async (bloodGroup?: string) => {
    setLoading(true);
    try {
      const data = await getActiveDonors(bloodGroup);
      setDonors(data);
    } catch (error) {
      console.error("Failed to fetch active donors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors(selectedBloodGroup || undefined);
  }, [selectedBloodGroup]);

  const urgentDonors = donors.filter(d => d.readyForUrgentDonation);
  const regularDonors = donors.filter(d => !d.readyForUrgentDonation);

  const handleChat = (donorId: number) => {
    router.push(`/chat?user=${donorId}`);
  };

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch (err) {
      console.error('Failed to copy phone number:', err);
    }
  };

  const DonorCard = ({ donor }: { donor: ActiveDonor }) => (
    <div className="rounded-lg border border-soft bg-surface-card p-3 transition-colors hover:bg-surface-hover">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setExpandedDonor(expandedDonor === donor.id ? null : donor.id)}
      >
        <Avatar className="h-8 w-8" src={donor.profilePicture} alt={donor.name || donor.username} fallback={(donor.name || donor.username).charAt(0).toUpperCase()} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-primary truncate">
              {donor.name || donor.username}
            </p>
            {donor.readyForUrgentDonation && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)]">
                Urgent
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            {donor.bloodGroup && <span>{donor.bloodGroup}</span>}
            {expandedDonor === donor.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </div>
        </div>
      </div>

      {expandedDonor === donor.id && (
        <div className="mt-3 pt-3 border-t border-soft space-y-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={() => handleChat(donor.id)}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Chat
            </Button>
            {donor.phone && (
              isMobile ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-xs"
                  onClick={() => window.open(`tel:${donor.phone}`, '_self')}
                >
                  <Phone className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleCopyPhone(donor.phone!)}
                >
                  {copiedPhone === donor.phone ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )
            )}
          </div>
          {donor.phone && !isMobile && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <Phone className="h-3 w-3" />
              <span>{donor.phone}</span>
              {copiedPhone === donor.phone && (
                <span className="text-green-500 font-medium">Copied!</span>
              )}
            </div>
          )}
          {donor.lastDonationDate && (
            <p className="text-xs text-muted">
              Last donation: {new Date(donor.lastDonationDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const DonorList = ({ title, donors: donorList, showEmpty = true }: { title: string; donors: ActiveDonor[]; showEmpty?: boolean }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
        <Users className="h-4 w-4" />
        {title} ({donorList.length})
      </h3>
      {donorList.length > 0 ? (
        <div className="space-y-2">
          {donorList.map((donor) => (
            <DonorCard key={donor.id} donor={donor} />
          ))}
        </div>
      ) : showEmpty ? (
        <p className="text-sm text-muted">No donors available</p>
      ) : null}
    </div>
  );

  return (
    <div className={`rounded-2xl border border-soft bg-surface-card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary">Active Donors</h2>
        <Select value={selectedBloodGroup} onChange={(e) => setSelectedBloodGroup(e.target.value)} className="w-24 h-8 text-xs">
          <option value="">All</option>
          {BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>
              {bg}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-surface-hover rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <DonorList title="Ready for Urgent" donors={urgentDonors} />
          <DonorList title="Available Donors" donors={regularDonors} showEmpty={urgentDonors.length === 0} />
        </div>
      )}
    </div>
  );
}

// Mobile modal version
export function ActiveDonorsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Active Donors
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Active Donors</DialogTitle>
        </DialogHeader>
        <ActiveDonors />
      </DialogContent>
    </Dialog>
  );
}