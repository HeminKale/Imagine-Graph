import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Fingerprint, Network, Users, Zap, ArrowRight, Play, Check,
  Sparkles, Shield, FileText, Search, Eye, MessageSquare, Star,
  ChevronDown, Menu, X, Lock, Brain, Database, TrendingUp
} from 'lucide-react';
import Logo from '../components/Logo';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-strong border-b border-white/10 shadow-2xl' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 glass-strong rounded-xl flex items-center justify-center border border-white/30 shadow-xl p-1.5">
                <Logo className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SOLARIS FORENSIC</h1>
                <p className="text-xs text-white/70">Intelligence Analysis Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-white/90 hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollToSection('showcase')} className="text-white/90 hover:text-white transition-colors">Capabilities</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-white/90 hover:text-white transition-colors">Reviews</button>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <a href="#/login" className="text-white/90 hover:text-white transition-colors font-medium">Sign In</a>
              <a href="#/login" className="glass-strong px-6 py-2.5 rounded-xl border border-white/30 hover:bg-white/20 transition-all font-semibold shadow-lg hover:scale-105">
                Get Started Free
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden glass-strong p-2 rounded-lg border border-white/30"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden mt-4 glass-strong rounded-2xl border border-white/20 p-6 space-y-4"
            >
              <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-white/90 hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollToSection('showcase')} className="block w-full text-left py-2 text-white/90 hover:text-white transition-colors">Capabilities</button>
              <button onClick={() => scrollToSection('testimonials')} className="block w-full text-left py-2 text-white/90 hover:text-white transition-colors">Reviews</button>
              <div className="pt-4 border-t border-white/20 space-y-3">
                <a href="#/login" className="block text-center py-2 text-white/90 hover:text-white transition-colors font-medium">Sign In</a>
                <a href="#/login" className="block text-center glass-strong px-6 py-2.5 rounded-xl border border-white/30 hover:bg-white/20 transition-all font-semibold">
                  Get Started Free
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-orb"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-orb" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-teal-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-orb" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 glass px-6 py-2 rounded-full border border-white/30 shadow-xl"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span className="text-sm font-medium">AI-Powered Forensic Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold leading-tight"
            >
              Uncover Truth Through
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-teal-300 text-transparent bg-clip-text">
                Advanced Intelligence
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed"
            >
              Map evidence, discover connections, and solve complex cases with Gemini 3 Pro AI-powered forensic analysis platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href="#/login"
                className="group glass-strong px-8 py-4 rounded-xl border border-white/30 hover:bg-white/20 transition-all font-semibold text-lg shadow-2xl hover:scale-105 flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="glass px-8 py-4 rounded-xl border border-white/20 hover:bg-white/10 transition-all font-semibold text-lg shadow-xl flex items-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mt-16"
            >
              {[
                { value: '10K+', label: 'Cases Analyzed' },
                { value: '500K+', label: 'Evidence Files' },
                { value: '99.9%', label: 'Accuracy Rate' }
              ].map((stat, idx) => (
                <div key={idx} className="glass-strong rounded-2xl p-6 border border-white/20 shadow-xl">
                  <div className="text-3xl font-bold text-cyan-300">{stat.value}</div>
                  <div className="text-sm text-white/70 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Product Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-20 glass-strong rounded-3xl p-4 border border-white/20 shadow-2xl max-w-6xl mx-auto"
          >
            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-white/10">
              <div className="text-center space-y-4">
                <Network className="w-20 h-20 text-cyan-400 mx-auto animate-pulse-slow" />
                <p className="text-white/60">Interactive Dashboard Preview</p>
              </div>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 text-center"
          >
            <p className="text-white/50 text-sm mb-6">Trusted by investigators at</p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
              {['Law Enforcement', 'Private Investigators', 'Legal Firms', 'Corporate Security', 'Forensic Labs'].map((org, idx) => (
                <div key={idx} className="text-white/60 font-semibold text-lg">{org}</div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white/40" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Everything you need for comprehensive forensic analysis and investigation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'AI-Powered Analysis', description: 'Gemini 3 Pro AI analyzes evidence and automatically discovers connections and patterns' },
              { icon: Network, title: 'Knowledge Graph', description: 'Visualize relationships between entities, events, and evidence in an interactive graph' },
              { icon: Users, title: 'Team Collaboration', description: 'Work together seamlessly with your team, share insights in real-time' },
              { icon: Zap, title: 'Lightning Fast Processing', description: 'Process thousands of evidence files in seconds with advanced AI' },
              { icon: FileText, title: 'Multi-Format Support', description: 'Upload PDFs, images, audio, video, and documents for analysis' },
              { icon: Search, title: 'Deep Search', description: 'Search across all evidence with AI-powered semantic understanding' }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group glass-strong rounded-2xl p-8 border border-white/20 hover:bg-white/10 transition-all duration-500 hover:scale-105 shadow-xl"
              >
                <div className="w-14 h-14 glass rounded-xl flex items-center justify-center border border-white/30 mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-cyan-300" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section id="showcase" className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-32">
          {[
            {
              title: 'Intelligent Evidence Mapping',
              description: 'Upload evidence files and let AI automatically extract entities, relationships, and contradictions. Build comprehensive knowledge graphs that reveal hidden connections.',
              features: ['Auto entity extraction', 'Relationship discovery', 'Contradiction detection', 'Timeline generation'],
              imagePosition: 'right'
            },
            {
              title: 'Interactive Knowledge Graph',
              description: 'Explore evidence relationships in a dynamic, interactive graph. Click nodes to inspect details, follow connections, and uncover patterns.',
              features: ['3D visualization', 'Node inspection', 'Link analysis', 'Timeline view'],
              imagePosition: 'left'
            },
            {
              title: 'AI-Powered Chat Assistant',
              description: 'Ask questions about your case and get instant answers with citations. The AI assistant understands context and helps you investigate.',
              features: ['Natural language queries', 'Evidence citations', 'Case insights', 'Smart suggestions'],
              imagePosition: 'right'
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className={`flex flex-col ${item.imagePosition === 'left' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}
            >
              <div className="flex-1 space-y-6">
                <h3 className="text-4xl font-bold">{item.title}</h3>
                <p className="text-xl text-white/70 leading-relaxed">{item.description}</p>
                <ul className="space-y-3">
                  {item.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3">
                      <div className="w-6 h-6 glass rounded-lg flex items-center justify-center border border-white/30">
                        <Check className="w-4 h-4 text-cyan-300" />
                      </div>
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <div className="glass-strong rounded-3xl p-6 border border-white/20 shadow-2xl">
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-white/10">
                    <Network className="w-16 h-16 text-cyan-400 opacity-50" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Trusted by Investigators</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              See what professionals say about SOLARIS Forensic
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Detective Sarah Chen', role: 'Lead Investigator', company: 'Metro PD', rating: 5, quote: 'SOLARIS has revolutionized how we analyze evidence. The AI-powered knowledge graph reveals connections we would have missed.' },
              { name: 'Michael Rodriguez', role: 'Forensic Analyst', company: 'Private Investigations', rating: 5, quote: 'The speed and accuracy of evidence processing is incredible. What used to take weeks now takes hours.' },
              { name: 'Emily Johnson', role: 'Legal Consultant', company: 'Johnson & Associates', rating: 5, quote: 'The visualization tools help us present complex cases to juries in a clear, compelling way.' }
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-strong rounded-2xl p-8 border border-white/20 shadow-xl space-y-4"
              >
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <div className="w-12 h-12 glass rounded-full flex items-center justify-center border border-white/30">
                    <Users className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-white/60">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-strong rounded-3xl p-12 border border-white/20 shadow-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Solve Your Next Case?
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Join investigators worldwide using SOLARIS Forensic to uncover truth and solve complex cases.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#/login"
                className="group glass-strong px-8 py-4 rounded-xl border border-white/30 hover:bg-white/20 transition-all font-semibold text-lg shadow-2xl hover:scale-105 flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <p className="text-sm text-white/50 mt-6">No credit card required • Free forever plan available</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 glass-strong rounded-xl flex items-center justify-center border border-white/30 p-1.5">
                  <Logo className="w-full h-full" />
                </div>
                <div>
                  <h3 className="font-bold">SOLARIS FORENSIC</h3>
                  <p className="text-xs text-white/60">Intelligence Platform</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Advanced forensic analysis powered by Gemini 3 Pro AI. Uncover truth through intelligence.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#showcase" className="hover:text-white transition-colors">Capabilities</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <p>© 2024 SOLARIS Forensic. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
