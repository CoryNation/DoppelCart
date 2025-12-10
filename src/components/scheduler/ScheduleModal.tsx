"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersonaSocialAccount } from "@/types/social";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    scheduledFor: string;
    personaSocialAccountId: string;
    platformId?: string;
  }) => Promise<void> | void;
  accounts: PersonaSocialAccount[];
  defaultDate?: string | null;
  defaultAccountId?: string | null;
  saving?: boolean;
  error?: string | null;
}

export function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  accounts,
  defaultDate,
  defaultAccountId,
  saving = false,
  error,
}: ScheduleModalProps) {
  const [scheduledFor, setScheduledFor] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);

  const platformOptions = useMemo(() => {
    return Array.from(new Set(accounts.map((account) => account.platform_id)));
  }, [accounts]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setScheduledFor(
      defaultDate
        ? new Date(defaultDate).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16)
    );

    if (defaultAccountId) {
      const account = accounts.find((acc) => acc.id === defaultAccountId);
      if (account) {
        setSelectedAccount(account.id);
        setSelectedPlatform(account.platform_id);
        return;
      }
    }

    if (accounts.length > 0) {
      setSelectedAccount(accounts[0].id);
      setSelectedPlatform(accounts[0].platform_id);
    } else {
      setSelectedAccount("");
      setSelectedPlatform("");
    }
  }, [isOpen, accounts, defaultAccountId, defaultDate]);

  const filteredAccounts = useMemo(() => {
    if (!selectedPlatform) return accounts;
    return accounts.filter((account) => account.platform_id === selectedPlatform);
  }, [accounts, selectedPlatform]);

  const handleSave = async () => {
    setLocalError(null);
    if (!scheduledFor) {
      setLocalError("Please select a scheduled date and time.");
      return;
    }
    if (!selectedAccount) {
      setLocalError("Please choose a social account.");
      return;
    }

    await onSave({
      scheduledFor: new Date(scheduledFor).toISOString(),
      personaSocialAccountId: selectedAccount,
      platformId: selectedPlatform || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule content"
      description="Pick a time and account to publish this post."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="schedule-date">Publish at</Label>
          <Input
            id="schedule-date"
            type="datetime-local"
            value={scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <select
            id="platform"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedPlatform}
            onChange={(event) => {
              setSelectedPlatform(event.target.value);
              const firstAccount = accounts.find(
                (acc) => acc.platform_id === event.target.value
              );
              setSelectedAccount(firstAccount?.id ?? "");
            }}
            disabled={platformOptions.length === 0}
          >
            {platformOptions.length === 0 ? (
              <option value="">No connected platforms</option>
            ) : (
              platformOptions.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="account">Social account</Label>
          <select
            id="account"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedAccount}
            onChange={(event) => setSelectedAccount(event.target.value)}
            disabled={filteredAccounts.length === 0}
          >
            {filteredAccounts.length === 0 ? (
              <option value="">No accounts available</option>
            ) : (
              filteredAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.platform_id} • {account.account_handle ?? "Unnamed"}
                </option>
              ))
            )}
          </select>
        </div>
        {(error || localError) && (
          <p className="text-sm text-destructive">{error || localError}</p>
        )}
      </div>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || accounts.length === 0}>
          {saving ? "Saving..." : "Save schedule"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}







