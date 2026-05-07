"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Plus,
  ExternalLink,
  Trash2,
  BarChart3,
  Copy,
  Check,
  LogOut,
  Link2,
} from "lucide-react";
import toast from "react-hot-toast";
import { urlApi, type URLItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatNumber, timeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newCode, setNewCode] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    loadUrls();
  }, [isAuthenticated]);

  const loadUrls = async () => {
    try {
      const data = await urlApi.list();
      setUrls(data);
    } catch {
      toast.error("Failed to load URLs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await urlApi.shorten({
        original_url: newUrl,
        custom_code: newCode || undefined,
      });
      setUrls([data, ...urls]);
      setNewUrl("");
      setNewCode("");
      setShowForm(false);
      toast.success("Link created");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this link permanently?")) return;
    try {
      await urlApi.delete(id);
      setUrls(urls.filter((u) => u.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleCopy = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalClicks = urls.reduce((s, u) => s + u.click_count, 0);

  return (
    <main className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:64px_64px] opacity-20 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <nav className="relative z-10 border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-pink-500">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">HyperScale</span>
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex items-center gap-2 text-sm text-ink-300 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-ink-300">Manage your shortened links</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" /> New Link
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard label="Total Links" value={formatNumber(urls.length)} icon={Link2} />
          <StatCard label="Total Clicks" value={formatNumber(totalClicks)} icon={BarChart3} />
          <StatCard
            label="Active Links"
            value={formatNumber(urls.filter((u) => u.is_active).length)}
            icon={Zap}
          />
        </div>

        {/* New URL form */}
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={handleCreate}
            className="glass mt-6 rounded-xl p-4"
          >
            <div className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
              <input
                type="url"
                required
                placeholder="https://example.com/very/long/url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-ink-400 focus:border-accent focus:outline-none"
              />
              <input
                type="text"
                placeholder="custom-slug (optional)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-ink-400 focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-accent text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Create
              </button>
            </div>
          </motion.form>
        )}

        {/* URL list */}
        <div className="mt-6 space-y-2">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="shimmer h-20 rounded-xl" />
              ))}
            </>
          ) : urls.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <Link2 className="mx-auto h-10 w-10 text-ink-500" />
              <h3 className="mt-4 font-medium text-white">No links yet</h3>
              <p className="mt-1 text-sm text-ink-400">Create your first short URL</p>
            </div>
          ) : (
            urls.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass group flex items-center gap-4 rounded-xl p-4 hover:border-white/20"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm font-semibold text-accent">
                      {u.short_url}
                    </code>
                    <button
                      onClick={() => handleCopy(u.id, u.short_url)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {copiedId === u.id ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-ink-400 hover:text-white" />
                      )}
                    </button>
                  </div>
                  <a
                    href={u.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 truncate text-xs text-ink-400 hover:text-ink-300"
                  >
                    <span className="truncate">{u.original_url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <p className="mt-1 text-xs text-ink-500">{timeAgo(u.created_at)}</p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(u.click_count)}
                  </p>
                  <p className="text-xs text-ink-400">clicks</p>
                </div>

                <Link
                  href={`/dashboard/${u.short_code}`}
                  className="rounded-lg bg-white/5 p-2 text-ink-300 hover:bg-white/10 hover:text-white"
                >
                  <BarChart3 className="h-4 w-4" />
                </Link>

                <button
                  onClick={() => handleDelete(u.id)}
                  className="rounded-lg bg-white/5 p-2 text-ink-300 hover:bg-danger/20 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
          {label}
        </span>
        <Icon className="h-4 w-4 text-ink-500" />
      </div>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
