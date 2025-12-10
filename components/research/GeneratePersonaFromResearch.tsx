"use client";

import { useState } from "react";
import Button, { type ButtonProps } from "@/components/ui/button";
import PersonaFromResearchModal from "./PersonaFromResearchModal";

interface GeneratePersonaFromResearchProps {
  researchId: string;
  researchTitle: string;
  disabled?: boolean;
  disabledReason?: string;
  buttonVariant?: ButtonProps["variant"];
  buttonFullWidth?: boolean;
}

export default function GeneratePersonaFromResearch({
  researchId,
  researchTitle,
  disabled,
  disabledReason,
  buttonVariant = "default",
  buttonFullWidth = false,
}: GeneratePersonaFromResearchProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    if (!disabled) {
      setOpen(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        variant={buttonVariant}
        fullWidth={buttonFullWidth}
      >
        Generate Persona from this Research
      </Button>

      <PersonaFromResearchModal
        open={open}
        onClose={() => setOpen(false)}
        researchId={researchId}
        researchTitle={researchTitle}
      />
    </>
  );
}







