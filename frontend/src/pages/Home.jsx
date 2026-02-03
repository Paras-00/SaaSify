import { DollarSign, Globe, HeadphonesIcon, Search, Shield, Zap } from 'lucide-react';

import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">
              Find Your Perfect Domain Name
            </h1>
            <p className="text-xl mb-8 text-purple-100">
              Search millions of domain names with instant availability checks.
              Professional hosting solutions for your business.
            </p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Search size={24} />
              Search Domains
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose SaaSify?</h2>
            <p className="text-lg text-gray-600">Everything you need to succeed online</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe className="text-purple-600" size={32} />}
              title="Domain Registration"
              description="Register your domain name in minutes with competitive pricing and instant setup."
            />
            <FeatureCard
              icon={<Shield className="text-purple-600" size={32} />}
              title="Secure & Private"
              description="Free WHOIS privacy protection and SSL certificates to keep your data safe."
            />
            <FeatureCard
              icon={<Zap className="text-purple-600" size={32} />}
              title="Fast DNS"
              description="Lightning-fast DNS propagation and 99.9% uptime guarantee for your domains."
            />
            <FeatureCard
              icon={<DollarSign className="text-purple-600" size={32} />}
              title="Competitive Pricing"
              description="Transparent pricing with no hidden fees. Special rates for bulk purchases."
            />
            <FeatureCard
              icon={<HeadphonesIcon className="text-purple-600" size={32} />}
              title="24/7 Support"
              description="Expert support team available around the clock to help you succeed."
            />
            <FeatureCard
              icon={<Search className="text-purple-600" size={32} />}
              title="Easy Management"
              description="Intuitive dashboard to manage all your domains and services in one place."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of satisfied customers who trust SaaSify
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/search"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Search Domains
            </Link>
            <Link
              to="/register"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-purple-600 hover:bg-purple-50 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
