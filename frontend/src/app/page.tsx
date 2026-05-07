"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Zap, BarChart3, Lock, Copy, Check, ArrowRight, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { urlApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [shortened, setShortened] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const result = await urlApi.shorten({ original_url: url });
      setShortened(result.short_url);
      toast.success("Link shortened!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to shorten URL");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shortened) return;
    navigator.clipboard.writeText(shortened);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-pattern bg-[size:64px_64px] opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between p-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-pink-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">HyperScale</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-medium text-ink-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-ink-100 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-16 md:pt-24 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink-300 backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Real-time analytics powered by WebSockets</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-5xl font-bold tracking-tight md:text-7xl text-gradient leading-[1.05]"
        >
          Links built for
          <br />
          <span className="text-gradient-accent">internet scale.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-ink-300 md:text-xl"
        >
          Shorten any URL in milliseconds. Track every click in real time. Built with the same
          patterns that power Bitly, TinyURL, and Twitter at scale.
        </motion.p>

        {/* Shortener form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onSubmit={handleShorten}
          className="mx-auto mt-12 max-w-2xl"
        >
          <div className="glass-strong flex items-center gap-2 rounded-xl p-2">
            <div className="pl-3">
              <Link2 className="h-5 w-5 text-ink-400" />
            </div>
            <input
              type="url"
              required
              placeholder="Paste your long URL here…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-transparent px-2 py-3 text-white placeholder-ink-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-all",
                "hover:bg-accent-hover hover:shadow-[0_0_24px_rgba(124,92,255,0.4)]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Shorten <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Result */}
        {shortened && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass mx-auto mt-6 flex max-w-2xl items-center justify-between rounded-xl p-4"
          >
            <code className="font-mono text-accent">{shortened}</code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </motion.div>
        )}
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Sub-50ms redirects",
              desc: "Redis-backed cache delivers blazing fast lookups. p99 latency under 50ms even at 10K+ QPS.",
            },
            {
              icon: BarChart3,
              title: "Live analytics",
              desc: "WebSocket-powered dashboards stream click events the instant they happen. No refreshing required.",
            },
            {
              icon: Lock,
              title: "Built for trust",
              desc: "JWT auth, rate limiting, and OWASP-compliant validation. Production-grade security from day one.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass group rounded-2xl p-6 transition-all hover:border-white/20"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-300 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center text-sm text-ink-400">
        <p>
          Built with FastAPI · PostgreSQL · Redis · Next.js · Open source on{" "}
          <a
            href="https://github.com/AnudeepAV/hyperscale-url-shortener"
            className="text-accent hover:underline"
          >
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
