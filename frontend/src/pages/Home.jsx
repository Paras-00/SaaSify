import { ArrowRight, Check, Database, Globe, Layers, Layout, Server, Shield, User, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="bg-brand-black min-h-screen font-sans text-brand-text-primary selection:bg-brand-green selection:text-brand-black overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-brand-black via-white to-white">

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-green/5 rounded-full blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-brand-secondary/10 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center justify-center text-center">


          <h1 className="text-6xl lg:text-8xl font-serif font-extrabold leading-tight mb-8 tracking-tight text-brand-text-primary max-w-5xl">
            Launch & Automate <br />
            <span className="italic text-brand-green relative inline-block">
              Your Hosting Platform
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-brand-green opacity-30" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C25.7501 2.99991 74.5422 -1.50002 115.5 2.00006C156.458 5.50014 185 8.99995 197.501 6.99997" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            </span>
          </h1>

          <p className="text-xl text-brand-text-secondary mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
            Launch and scale your hosting business with SaaSify premium. Engineered for MEARN stack and Node environments where performance is non-negotiable.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link
              to="/register"
              className="inline-flex justify-center items-center bg-brand-green hover:bg-brand-green-hover text-white px-10 py-5 rounded-full text-xl font-bold transition-all hover:scale-105 shadow-xl shadow-brand-green/30"
            >
              Start Free Trial
            </Link>
            <Link
              to="/demo"
              className="inline-flex justify-center items-center px-10 py-5 rounded-full text-xl font-medium text-brand-text-primary border-2 border-brand-green/50 hover:bg-brand-green/5 transition-all group bg-transparent shadow-sm"
            >
              View Demo
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-base text-brand-text-secondary font-medium">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
              <div className="p-1 rounded-full"><Check size={16} className="text-brand-green" /></div>
              99.99% Uptime
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
              <div className="p-1 rounded-full"><Check size={16} className="text-brand-green" /></div>
              24/7 Support
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
              <div className="p-1 rounded-full"><Check size={16} className="text-brand-green" /></div>
              Global CDN
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section id="features" className="py-24 bg-brand-black relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-5xl font-serif mb-6 text-brand-text-primary">
            <span className="italic text-brand-text-secondary">End-to-End</span> Infrastructure Automation
          </h2>
          <p className="text-lg text-brand-text-secondary max-w-2xl mx-auto">
            Manual processes are the bottleneck of your growth. We automate the lifecycle.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-16 grid md:grid-cols-3 gap-8">
          <ValueCard
            icon={<Layers className="text-brand-green" />}
            title="Manual Renewals"
            desc="Eliminate the headache of tracking expiry dates. Let the system handle the timeline."
          />
          <ValueCard
            icon={<Zap className="text-brand-green" />}
            title="Payment Follow-ups"
            desc="Stop chasing invoices. Automated recurring billing ensures revenue consistency."
          />
          <ValueCard
            icon={<Layout className="text-brand-green" />}
            title="Expansion Tracking"
            desc="Grow without limits. Our engine handles provisioning, from 1 to 1M+."
          />
        </div>
      </section>

      {/* Core Platform Features */}
      <section id="platform" className="py-24 bg-white border-t border-brand-gray/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-serif mb-2 text-brand-text-primary">Core Platform<br /><span className="italic text-brand-text-secondary">Features</span></h2>
            </div>
            <p className="text-brand-text-secondary max-w-sm text-sm font-medium">
              Everything you need to run a world-class hosting infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Globe size={24} />}
              title="Multi-Region Deploy"
              description="Deploy globally with one click across AWS, GCP, and Azure nodes."
            />
            <FeatureCard
              icon={<Shield size={24} />}
              title="Automated SSL"
              description="Auto-renewing revenue generation with Stripe and PayPal integrations."
            />
            <FeatureCard
              icon={<Layout size={24} />}
              title="API-First Design"
              description="Build your own UI or extend ours with our robust REST API."
            />
            <FeatureCard
              icon={<Database size={24} />}
              title="Instant Provisioning"
              description="Raw metal power, virtualized and ready in seconds."
            />
            <FeatureCard
              icon={<Zap size={24} />}
              title="Auto-Scaling"
              description="Dynamic resource allocation keeps pace with your customer demand."
            />
            <FeatureCard
              icon={<Shield size={24} />}
              title="DDoS Protection"
              description="Enterprise-grade perimeter security protecting customer data 24/7."
            />
          </div>
        </div>
      </section>

      {/* Path to Automation */}
      <section id="workflow" className="py-24 bg-brand-black/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-brand-text-secondary mb-16">
            Path to <span className="text-brand-green">Automation</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-brand-gray/30 z-0 dashed"></div>

            <StepCard number="1" title="Connect Infrastructure" desc="Link your cloud providers via API keys in seconds." />
            <StepCard number="2" title="Configure Plans" desc="Set pricing tiers, resource limits, and billing cycles." />
            <StepCard number="3" title="Automate Growth" desc="Launch your site and watch the system drive sales." />
          </div>
        </div>
      </section>

      {/* Built for Infrastructure Teams */}
      <section className="py-24 bg-brand-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-serif mb-6 text-white">
                Built for <br />
                <span className="italic text-brand-text-secondary text-brand-gray">Infrastructure Teams</span>
              </h2>
              <p className="text-brand-gray text-lg mb-12 leading-relaxed">
                Under the hood, SaaSify runs on a Mesh-connected stack designed for high uptime.
                Vertical scaling is fully automated, handling API responses and MongoDB updates for seamless data performance.
              </p>

              <div className="flex gap-12">
                <div>
                  <div className="text-4xl font-bold text-white mb-1">50<span className="text-brand-black text-2xl">ms</span></div>
                  <div className="text-xs uppercase tracking-wider text-brand-gray">Avg Latency</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-1">100<span className="text-brand-black text-2xl">+</span></div>
                  <div className="text-xs uppercase tracking-wider text-brand-gray">Regions Globally</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-8">Security & Resilience</h3>
              <div className="space-y-6">
                <SecurityRow title="AES-256 Encryption" desc="Enterprise grade data protection at rest." />
                <SecurityRow title="Global Provider List" desc="Seamless integration with top cloud providers." />
                <SecurityRow title="Automated Backups" desc="Full redundancy for disaster recovery." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* High-Performance Architecture */}
      <section id="architecture" className="py-24 bg-brand-black text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-serif mb-4 text-brand-text-primary">High-Performance <span className="italic text-brand-green">Architecture</span></h2>
          <p className="text-brand-text-secondary text-sm uppercase tracking-widest mb-16 font-medium">Transparent System Design</p>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 bg-white p-10 rounded-3xl shadow-lg border border-gray-300">
            <ArchNode icon={<User size={24} />} label="Client" />
            <ArrowRight className="text-brand-gray/50" size={24} />
            <ArchNode icon={<Globe size={24} />} label="Edge API" />
            <ArrowRight className="text-brand-gray/50" size={24} />
            <ArchNode icon={<Zap size={24} />} label="Core" />
            <ArrowRight className="text-brand-gray/50" size={24} />
            <ArchNode icon={<Server size={24} />} label="Worker" />
            <ArrowRight className="text-brand-gray/50" size={24} />
            <ArchNode icon={<Database size={24} />} label="Storage" />
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-brand-text-primary">SaaSify <span className="text-brand-text-secondary text-2xl font-sans italic">vs.</span> Manual</h2>
          </div>

          <div className="bg-brand-black/30 border border-gray-300 rounded-3xl overflow-hidden shadow-lg">
            <div className="grid grid-cols-3 p-6 border-b border-brand-gray/10 bg-brand-green/5 text-sm font-bold text-brand-text-primary uppercase tracking-wide">
              <div className="text-brand-text-secondary">Capability</div>
              <div className="text-center text-brand-green">SaaSify</div>
              <div className="text-center text-brand-text-secondary">Manual Operations</div>
            </div>

            <ComparisonRow bg feature="Provisioning Time" saasify="Instant" manual="2-4 Hours" />
            <ComparisonRow feature="Billing Accuracy" saasify="100.00%" manual="Variable" />
            <ComparisonRow bg feature="Auto-Suspension" saasify={true} manual={false} />
            <ComparisonRow feature="Multi-Region Support" saasify={true} manual={true} />
            <ComparisonRow bg feature="Error Rate" saasify="<0.01%" manual="High Risk" />

          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-brand-black relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-brand-gray/5 z-0"></div>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-6xl font-serif mb-8 text-brand-text-primary">
            Ready to Automate?
            <br />
            <span className="text-brand-text-secondary text-2xl md:text-3xl font-sans mt-4 block">Join the infrastructure revolution.</span>
          </h2>
          <p className="text-brand-text-secondary max-w-xl mx-auto mb-10 text-lg">
            Join over 500+ hosting providers who have scaled their operations without adding more staff.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="bg-brand-green text-white px-12 py-5 rounded-full text-xl font-bold hover:bg-brand-green-hover transition-all shadow-xl shadow-brand-green/30 hover:scale-105"
            >
              Get Started Now
            </Link>
            <Link
              to="/contact"
              className="px-12 py-5 rounded-full text-xl font-medium text-brand-text-primary border-2 border-brand-gray/30 hover:bg-brand-green/5 transition-all bg-white"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-brand-text-primary mb-4">
              Simple, Transparent <span className="text-brand-green">Pricing</span>
            </h2>
            <p className="text-brand-text-secondary text-lg">
              Start small and scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              title="Starter"
              price="$29"
              description="Perfect for side projects and small apps."
              features={["1 Core CPU", "2GB RAM", "10GB SSD Storage", "Global CDN", "Community Support"]}
            />
            <PricingCard
              title="Pro"
              price="$99"
              description="For growing businesses and high traffic."
              features={["4 Core CPU", "8GB RAM", "100GB SSD Storage", "Priority Global CDN", "24/7 Priority Support", "Advanced Analytics"]}
              highlight
            />
            <PricingCard
              title="Enterprise"
              price="Custom"
              description="For large scale applications with custom needs."
              features={["Custom CPU/RAM", "Unlimited Storage", "Dedicated Infrastructure", "SLA Guarantee", "Account Manager", "SSO & Audit Logs"]}
              buttonText="Contact Sales"
            />
          </div>
        </div>
      </section>

    </div>
  );
}

// Internal Components

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group p-8 rounded-3xl bg-brand-black border border-brand-gray/10 shadow-sm hover:shadow-xl hover:border-brand-green/20 transition-all duration-300 transform hover:-translate-y-1">
      <div className="mb-6 text-brand-green bg-brand-green/5 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-brand-green/10">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-brand-text-primary mb-3">{title}</h3>
      <p className="text-brand-text-secondary text-base leading-relaxed">{description}</p>
    </div>
  );
}

function ValueCard({ icon, title, desc }) {
  return (
    <div className="group p-8 bg-white border border-gray-300 rounded-3xl hover:border-brand-green/20 hover:shadow-xl transition-all duration-300 text-left">
      <div className="mb-4 inline-flex p-4 rounded-2xl bg-brand-green/5 text-brand-text-primary group-hover:text-brand-green group-hover:bg-brand-green/10 transition-all shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-brand-text-primary mb-2 mt-4">{title}</h3>
      <p className="text-sm text-brand-text-secondary leading-relaxed font-medium">{desc}</p>
    </div>
  )
}

function SecurityRow({ title, desc }) {
  return (
    <div className="flex gap-4 items-center">
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/10">
        <Check size={18} className="text-white" />
      </div>
      <div>
        <h4 className="text-white font-bold text-lg">{title}</h4>
        <p className="text-white/80 text-sm">{desc}</p>
      </div>
    </div>
  )
}

function StepCard({ number, title, desc }) {
  return (
    <div className="relative z-10 flex flex-col items-center group text-center p-8 bg-white rounded-3xl border border-gray-300 shadow-sm hover:shadow-lg transition-all">
      <div className="w-14 h-14 rounded-full bg-brand-black border-2 border-brand-green/10 flex items-center justify-center text-brand-text-primary font-bold text-xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
        {number}
      </div>
      <h3 className="text-xl font-bold text-brand-text-primary mb-3 uppercase tracking-wide">{title}</h3>
      <p className="text-brand-text-secondary leading-relaxed font-medium">{desc}</p>
    </div>
  )
}

function ArchNode({ icon, label }) {
  return (
    <div className="flex flex-col items-center gap-3 group cursor-default p-2">
      <div className="w-16 h-16 rounded-2xl bg-brand-black border border-gray-300 flex items-center justify-center text-brand-text-primary shadow-sm group-hover:shadow-[0_0_20px_-5px_rgba(53,82,69,0.3)] group-hover:border-brand-green/30 group-hover:text-brand-green transition-all duration-300">
        {icon}
      </div>
      <span className="text-xs uppercase font-bold text-brand-text-secondary tracking-wider group-hover:text-brand-text-primary transition-colors">{label}</span>
    </div>
  )
}

function ComparisonRow({ feature, saasify, manual, bg }) {
  return (
    <div className={`grid grid-cols-3 p-4 items-center border-b border-brand-gray/10 last:border-0 ${bg ? 'bg-brand-black/20' : ''}`}>
      <div className="text-brand-text-primary font-bold pl-2">{feature}</div>
      <div className="text-center text-brand-green font-extrabold flex justify-center drop-shadow-sm">
        {saasify === true ? <Check size={24} strokeWidth={3} /> : saasify}
      </div>
      <div className="text-center text-brand-text-secondary flex justify-center font-medium">
        {manual === true ? <Check size={24} /> : manual === false ? <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-full border border-red-100">LOW</span> : manual}
      </div>
    </div>
  )
}


function PricingCard({ title, price, description, features, highlight, buttonText = "Get Started" }) {
  return (
    <div className={`relative p-8 rounded-3xl flex flex-col h-full bg-white transition-all duration-300 ${highlight ? 'shadow-2xl ring-4 ring-brand-green/20 scale-105 z-10' : 'shadow-lg border border-gray-300 hover:shadow-xl'}`}>
      {highlight && (
        <div className="absolute -top-4 left-0 right-0 mx-auto w-max px-6 py-1.5 rounded-full bg-brand-green text-white text-xs font-bold uppercase tracking-wider shadow-lg">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-bold text-brand-text-primary mb-2">{title}</h3>
        <div className="flex items-baseline gap-1 my-4">
          <span className="text-5xl font-extrabold text-brand-text-primary tracking-tight">{price}</span>
          {price !== "Custom" && <span className="text-brand-text-secondary font-medium">/mo</span>}
        </div>
        <p className="text-brand-text-secondary text-sm font-medium">{description}</p>
      </div>

      <div className="flex-grow space-y-4 mb-8">
        {features.map((feature, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-brand-text-secondary font-medium">
            <div className="bg-brand-green/10 p-0.5 rounded-full">
              <Check size={14} className="text-brand-green" />
            </div>
            {feature}
          </div>
        ))}
      </div>

      <button className={`w-full py-4 rounded-full font-bold transition-all ${highlight ? 'bg-brand-green text-white hover:bg-brand-green-hover shadow-lg shadow-brand-green/20' : 'bg-brand-black text-brand-text-primary hover:bg-brand-gray border border-gray-300'}`}>
        {buttonText}
      </button>
    </div>
  )
}

