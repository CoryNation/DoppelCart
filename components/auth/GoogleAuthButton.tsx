import Button from "@/components/ui/button";

interface GoogleAuthButtonProps {
  isLoading: boolean;
  onClick: () => void;
  text?: string;
}

export function GoogleAuthButton({ isLoading, onClick, text = "Continue with Google" }: GoogleAuthButtonProps) {
  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-body-s">
          <span className="px-2 bg-surface-container text-text-tertiary">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={onClick}
        disabled={isLoading}
      >
        {text}
      </Button>
    </>
  );
}

