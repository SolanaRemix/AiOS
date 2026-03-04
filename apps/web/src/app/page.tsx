"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Bot,
  Brain,
  Shield,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star,
  Github,
  Twitter,
  Linkedin,
  ChevronRight,
  Code2,
  Cpu,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Bot,
    title: "Multi-Agent AI",
    description:
      "9 specialized AI agents working in concert — orchestrator, code generator, debugger, tester, documenter, security auditor, and more.",
    color: "cyan",
    badge: "Core",
  },
  {
    icon: Brain,
    title: "LLM Federation",
    description:
      "Seamlessly switch between GPT-4o, Claude 3.5, Gemini 1.5, and LLaMA 3 based on task requirements and cost optimization.",
    color: "purple",
    badge: "Intelligent",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Multi-tenant isolation, RBAC, audit logs, SOC2 compliance, and end-to-end encryption for enterprise-grade security.",
    color: "pink",
    badge: "Enterprise",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description:
      "WebSocket-powered live collaboration with your team. Share context, review AI outputs, and iterate in real-time.",
    color: "green",
    badge: "Team",
  },
  {
    icon: Code2,
    title: "IDE Integration",
    description:
      "Built-in code editor with AI assistance, file management, terminal output, and seamless GitHub integration.",
    color: "yellow",
    badge: "Developer",
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description:
      "Track token consumption, costs, agent performance, and ROI with detailed dashboards and exportable reports.",
    color: "orange",
    badge: "Analytics",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create a Project",
    description:
      "Start a new project and describe your goals. AIOS automatically spins up the right mix of AI agents.",
    icon: FolderPlusIcon,
  },
  {
    step: "02",
    title: "Agents Go to Work",
    description:
      "Your AI team collaborates — planning, coding, reviewing, testing, and documenting — autonomously.",
    icon: Bot,
  },
  {
    step: "03",
    title: "Deploy & Scale",
    description:
      "One-click deployment to production. Monitor performance, scale automatically, and iterate continuously.",
    icon: Globe,
  },
];

function FolderPlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for exploring AIOS capabilities.",
    features: [
      "3 projects",
      "2 AI agents",
      "100K tokens/month",
      "GPT-3.5 access",
      "Community support",
      "Basic analytics",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For professional developers and small teams.",
    features: [
      "Unlimited projects",
      "All 9 AI agents",
      "10M tokens/month",
      "All LLM models",
      "Priority support",
      "Advanced analytics",
      "API access",
      "Custom integrations",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For large organizations with advanced needs.",
    features: [
      "Everything in Pro",
      "Unlimited tokens",
      "Dedicated infrastructure",
      "SSO / SAML",
      "SLA guarantee",
      "Custom models",
      "On-premise option",
      "Dedicated CSM",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "CTO at TechNova",
    avatar: "SC",
    content:
      "AIOS reduced our development cycle by 70%. The multi-agent system handles everything from architecture to deployment. It's like having a senior engineering team on autopilot.",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "Lead Developer at StartupX",
    avatar: "MR",
    content:
      "The LLM federation is genius. It automatically picks the best model for each task and our costs dropped by 40% while quality improved. This is the future of software development.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "VP Engineering at DataCorp",
    avatar: "EW",
    content:
      "Enterprise security and compliance were our biggest concerns. AIOS ticked every box — SOC2, RBAC, audit logs. Deployment took 2 days instead of the 2 months we expected.",
    rating: 5,
  },
];

const colorMap: Record<string, string> = {
  cyan: "text-primary border-primary/30 bg-primary/5",
  purple: "text-secondary border-secondary/30 bg-secondary/5",
  pink: "text-accent border-accent/30 bg-accent/5",
  green: "text-green-400 border-green-400/30 bg-green-400/5",
  yellow: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  orange: "text-orange-400 border-orange-400/30 bg-orange-400/5",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#080810]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">AIOS</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 flex-1">
            <Link href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm text-white/60 hover:text-white transition-colors">How it works</Link>
            <Link href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</Link>
            <Link href="#testimonials" className="text-sm text-white/60 hover:text-white transition-colors">Testimonials</Link>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="neon" size="sm">Get Started <ArrowRight className="w-3 h-3" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-[100px]" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-[150px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="neon" className="mb-6 px-4 py-1.5 text-sm">
              <Sparkle className="w-3 h-3 mr-1" />
              Now in Public Beta · 1000+ teams building with AIOS
            </Badge>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight mb-6">
              <span className="gradient-text">AIOS</span>
              <br />
              <span className="text-white">The AI</span>
              <br />
              <span className="text-white/70">Operating System</span>
            </h1>

            <p className="text-xl sm:text-2xl text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed">
              Build, Deploy, Scale with{" "}
              <span className="text-primary font-semibold">Multi-Agent AI</span>
              ,{" "}
              <span className="text-secondary font-semibold">LLM Federation</span>
              , and{" "}
              <span className="text-accent font-semibold">Enterprise Security</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/register">
                <Button variant="gradient" size="xl" className="w-full sm:w-auto gap-2">
                  Start Building Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="xl" className="w-full sm:w-auto gap-2">
                  <Cpu className="w-5 h-5" />
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/40"
            >
              {[
                { value: "9", label: "AI Agents" },
                { value: "5+", label: "LLM Models" },
                { value: "10M+", label: "Tokens/Month" },
                { value: "99.9%", label: "Uptime SLA" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-glass-lg">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-white/2">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-4 text-xs text-white/30 font-mono">aios.ai/dashboard</span>
              </div>
              {/* Dashboard preview */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: "Projects", value: "24", color: "#00f5ff", delta: "+12%" },
                  { label: "Active Agents", value: "9/9", color: "#7c3aed", delta: "100%" },
                  { label: "API Calls Today", value: "12.4K", color: "#f0abfc", delta: "+34%" },
                  { label: "Monthly Cost", value: "$142", color: "#00ff88", delta: "-18%" },
                ].map((item) => (
                  <div key={item.label} className="bg-white/3 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-white/40 mb-1">{item.label}</p>
                    <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-xs text-green-400 mt-1">{item.delta}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="bg-white/3 rounded-xl p-4 border border-white/5 h-32 flex items-center justify-center">
                  <div className="flex items-end gap-1 h-full py-2">
                    {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(to top, #00f5ff, #7c3aed)`,
                          opacity: 0.7,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Badge variant="neon-purple" className="mb-4">Features</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Everything you need to{" "}
              <span className="gradient-text">build with AI</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              AIOS combines the power of multiple AI models with enterprise-grade infrastructure
              to accelerate your development workflow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const colorClass = colorMap[feature.color] || colorMap.cyan;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg text-white">{feature.title}</h3>
                    <Badge variant="outline" className="text-xs">{feature.badge}</Badge>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Badge variant="neon" className="mb-4">How It Works</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              From idea to{" "}
              <span className="gradient-text">production</span>
              {" "}in minutes
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-[calc(33%-20px)] right-[calc(33%-20px)] h-px bg-gradient-to-r from-primary via-secondary to-accent opacity-30" />

            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="text-center relative"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-neon">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-6xl font-black text-white/5 mb-2 font-mono">{step.step}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Badge variant="neon-purple" className="mb-4">Pricing</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Simple, <span className="gradient-text">transparent</span> pricing
            </h2>
            <p className="text-white/50 text-lg">
              Start free, scale as you grow. No hidden fees.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative glass-card rounded-2xl p-8 ${
                  plan.highlighted
                    ? "border-primary/40 shadow-neon scale-105"
                    : ""
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="neon" className="px-4 py-1">{plan.badge}</Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black ${plan.highlighted ? "text-primary" : "text-white"}`}>
                      {plan.price}
                    </span>
                    <span className="text-white/40 text-sm">/{plan.period}</span>
                  </div>
                  <p className="text-white/50 text-sm mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href={plan.name === "Enterprise" ? "#contact" : "/register"}>
                  <Button
                    variant={plan.highlighted ? "gradient" : "outline"}
                    size="lg"
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Badge variant="neon" className="mb-4">Testimonials</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Loved by <span className="gradient-text">developers</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                    <p className="text-xs text-white/40">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10" />
          <div className="cyber-grid absolute inset-0 opacity-20" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-6xl font-black mb-6">
              Ready to build the{" "}
              <span className="gradient-text">future</span>?
            </h2>
            <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto">
              Join thousands of developers using AIOS to ship faster, smarter, and more securely.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button variant="gradient" size="xl" className="w-full sm:w-auto">
                  Start for Free
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="xl" className="w-full sm:w-auto gap-2">
                  <Github className="w-5 h-5" />
                  View on GitHub
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xl gradient-text">AIOS</span>
              </div>
              <p className="text-white/40 text-sm max-w-xs leading-relaxed">
                The AI Operating System for enterprise teams. Build, deploy, and scale with AI agents.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Changelog", "Roadmap"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact"],
              },
              {
                title: "Legal",
                links: ["Privacy", "Terms", "Security", "Cookies"],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">
                  {col.title}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/30">
              © 2024 AIOS. All rights reserved.
            </p>
            <p className="text-sm text-white/30">
              Built with ❤️ for the future of AI development
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.09 8.26L19 7L14.74 11.26L21 12L14.74 12.74L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.74L3 12L9.26 11.26L5 7L10.91 8.26L12 2Z" />
    </svg>
  );
}
