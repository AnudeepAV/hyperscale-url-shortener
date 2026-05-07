"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { urlApi, type AnalyticsData } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useLiveClicks } from "@/hooks/useLiveClicks";
import { formatNumber, timeAgo } from "@/lib/utils";

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const shortCode = params.shortCode as string;
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { events, connected } = useLiveClicks(shortCode);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    loadAnalytics();
    // Re-poll every 10s as a fallback to WS
    const interval = setInterval(loadAnalytics, 10000);
    return () => clearInterval(interval);
  }, [shortCode, isAuthenticated]);

  const loadAnalytics = async () => {
    try {
      const result = await urlApi.analytics(shortCode);
      setData(result);
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </main>
    );
  }

  const deviceIcons: Record<string, any> = {
    mobile: Smartphone,
    desktop: Monitor,
    tablet: Tablet,
  };

  return (
    <main className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:64px_64px] opacity-20 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <nav className="relative z-10 border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-ink-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-success animate-pulse-glow" : "bg-ink-500"
              }`}
            />
            <span className="text-ink-300">{connected ? "Live" : "Disconnected"}</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Analytics for <code className="text-accent">/{shortCode}</code>
          </h1>
          <p className="mt-1 text-sm text-ink-400">Real-time click insights</p>
        </div>

        {/* Top stats */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <BigStat label="Total Clicks" value={formatNumber(data.total_clicks)} icon={Activity} />
          <BigStat
            label="Unique Visitors"
            value={formatNumber(data.unique_visitors)}
            icon={TrendingUp}
          />
          <BigStat
            label="Engagement"
            value={
              data.total_clicks > 0
                ? `${Math.round((data.unique_visitors / data.total_clicks) * 100)}%`
                : "0%"
            }
            icon={Globe}
          />
        </div>

        {/* Time series chart */}
        <div className="glass mt-6 rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">
            Clicks over time
          </h2>
          <div className="mt-4 h-64">
            {data.clicks_over_time.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.clicks_over_time}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="#64738a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64738a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(13,15,20,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#7c5cff"
                    strokeWidth={2}
                    dot={{ fill: "#7c5cff", r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-500">
                No click data yet
              </div>
            )}
          </div>
        </div>

        {/* Devices + Browsers */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">
              Devices
            </h2>
            <div className="mt-4 space-y-3">
              {data.top_devices.length > 0 ? (
                data.top_devices.map((d) => {
                  const Icon = deviceIcons[d.device] || Globe;
                  const pct = data.total_clicks
                    ? (d.count / data.total_clicks) * 100
                    : 0;
                  return (
                    <div key={d.device} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-white capitalize">
                          <Icon className="h-4 w-4 text-ink-400" />
                          {d.device}
                        </span>
                        <span className="text-ink-400">{d.count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-pink-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-ink-500">No data yet</p>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">
              Top Browsers
            </h2>
            <div className="mt-4 h-48">
              {data.top_browsers.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.top_browsers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="browser" stroke="#64738a" fontSize={11} />
                    <YAxis stroke="#64738a" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(13,15,20,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="#7c5cff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-500">
                  No data yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live feed */}
        <div className="glass mt-6 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">
              Live Click Feed
            </h2>
            <span className="text-xs text-ink-500">{events.length} recent events</span>
          </div>
          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
            <AnimatePresence>
              {events.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-500">
                  Waiting for clicks…
                </p>
              ) : (
                events.map((e, i) => {
                  const Icon = deviceIcons[e.device_type || ""] || Globe;
                  return (
                    <motion.div
                      key={`${e.clicked_at}-${i}`}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white">
                          New click from <span className="capitalize">{e.device_type}</span>{" "}
                          · {e.browser}
                        </p>
                        <p className="text-xs text-ink-500">{timeAgo(e.clicked_at)}</p>
                      </div>
                      <Zap className="h-4 w-4 text-accent" />
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}

function BigStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
          {label}
        </span>
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <p className="mt-3 text-4xl font-bold text-white">{value}</p>
    </div>
  );
}
