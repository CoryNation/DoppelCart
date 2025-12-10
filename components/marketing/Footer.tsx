import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface-container border-t border-border py-12 md:py-16">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-xl font-bold text-primary">DoppleCart</span>
            </Link>
            <p className="text-body-m text-text-secondary max-w-xs">
              Autonomous influencer agents for modern entrepreneurs. Build your
              audience with unencumbered efficiency.
            </p>
          </div>
          
          <div>
            <h4 className="text-body-s font-semibold text-text-primary uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#features"
                  className="text-body-s text-text-secondary hover:text-primary transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-body-s text-text-secondary hover:text-primary transition-colors"
                >
                  How it Works
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-body-s text-text-secondary hover:text-primary transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-body-s font-semibold text-text-primary uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-body-s text-text-secondary hover:text-primary transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-body-s text-text-secondary hover:text-primary transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-body-s text-text-secondary hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border gap-4">
          <p className="text-body-s text-text-tertiary">
            © {new Date().getFullYear()} DoppleCart. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <Link href="#" className="text-text-tertiary hover:text-primary transition-colors">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="#" className="text-text-tertiary hover:text-primary transition-colors">
              <Linkedin className="h-5 w-5" />
              <span className="sr-only">LinkedIn</span>
            </Link>
            <Link href="#" className="text-text-tertiary hover:text-primary transition-colors">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}









