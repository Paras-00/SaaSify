import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-brand-green text-white py-20 relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="text-2xl font-serif font-bold tracking-tight mb-6 block">
              SaaSify
            </Link>
            <p className="text-white/70 max-w-sm text-sm leading-relaxed mb-8">
              Premium hosting infrastructure for modern digital engineering teams. Built for unexpected scale and critical uptime.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-brand-green transition-all duration-300">
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-white/50">Product</h4>
            <ul className="space-y-4 text-sm text-white/80">
              <li><a href="/#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="/#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><Link to="/search" className="hover:text-white transition-colors">Domain Search</Link></li>
              <li><a href="/#architecture" className="hover:text-white transition-colors">Architecture</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-white/50">Company</h4>
            <ul className="space-y-4 text-sm text-white/80">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} SaaSify Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
