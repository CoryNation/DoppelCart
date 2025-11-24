import Card, { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
  showBackToHome?: boolean;
}

export function AuthCard({
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
  showBackToHome = true,
}: AuthCardProps) {
  return (
    <div className="z-10 max-w-md w-full">
      <h1 className="text-h2 text-center mb-8">{title}</h1>
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          
          {(footerText && footerLinkText && footerLinkHref) && (
            <div className="mt-6 text-center">
              <p className="text-body-m text-text-secondary">
                {footerText}{" "}
                <Link
                  href={footerLinkHref}
                  className="text-primary hover:underline transition-motion"
                >
                  {footerLinkText}
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showBackToHome && (
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-body-m text-primary hover:underline transition-motion"
          >
            ← Back to home
          </Link>
        </div>
      )}
    </div>
  );
}

