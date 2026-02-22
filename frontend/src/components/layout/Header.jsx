import { Link } from 'react-router-dom';
import { Menu, ShoppingCart, User, X } from 'lucide-react';

import useAuthStore from '../../store/authStore';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-green/[0.12] backdrop-blur-3xl border-b border-brand-green/[0.2] shadow-[0_10px_50px_rgba(0,0,0,0.15)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded bg-brand-green flex items-center justify-center transition-transform group-hover:rotate-12">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-serif text-brand-text-primary group-hover:text-brand-green transition-colors">
                SaaSify
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="/#features"
              className="text-sm font-medium text-brand-text-secondary hover:text-brand-green transition-colors"
            >
              Features
            </a>
            <a
              href="/#workflow"
              className="text-sm font-medium text-brand-text-secondary hover:text-brand-green transition-colors"
            >
              Workflow
            </a>
            <a
              href="/#architecture"
              className="text-sm font-medium text-brand-text-secondary hover:text-brand-green transition-colors"
            >
              Architecture
            </a>
            <a
              href="/#pricing"
              className="text-sm font-medium text-brand-text-secondary hover:text-brand-green transition-colors"
            >
              Pricing
            </a>

            <div className="h-6 w-px bg-white/10 mx-4"></div>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard/cart"
                  className="text-brand-text-secondary hover:text-brand-green transition-colors"
                >
                  <ShoppingCart size={20} />
                </Link>
                <Link
                  to="/dashboard"
                  className="bg-brand-green hover:bg-brand-green-hover text-white px-5 py-2 rounded-full transition-all flex items-center gap-2 text-sm shadow-lg shadow-brand-green/20"
                >
                  <User size={16} />
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link
                  to="/login"
                  className="relative group px-6 py-2.5 rounded-full text-sm font-semibold text-brand-text-primary transition-all overflow-hidden"
                >
                  <span className="relative z-10 group-hover:text-brand-green transition-colors duration-300">Log in</span>
                  <div className="absolute inset-0 bg-brand-gray/40 border border-brand-gray backdrop-blur-md rounded-full group-hover:bg-brand-gray/60 group-hover:border-brand-green/30 transition-all duration-300 shadow-sm"></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl bg-brand-green/10 transition-opacity duration-300"></div>
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-green hover:bg-brand-green-hover text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-green/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-brand-green"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5 bg-brand-black absolute left-0 right-0 px-4">
            <div className="flex flex-col space-y-4">
              <a
                href="/#features"
                className="text-brand-text-secondary hover:text-brand-green transition-colors text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="/#workflow"
                className="text-brand-text-secondary hover:text-brand-green transition-colors text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Workflow
              </a>
              <a
                href="/#architecture"
                className="text-brand-text-secondary hover:text-brand-green transition-colors text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Architecture
              </a>
              <a
                href="/#pricing"
                className="text-brand-text-secondary hover:text-brand-green transition-colors text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-brand-gray text-white px-4 py-2 rounded-lg text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-white hover:text-brand-green"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="bg-brand-green text-black px-4 py-2 rounded-lg text-center font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
