"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginValues, string>>>({});
  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof LoginValues]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginValues, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as keyof LoginValues] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl">
      {/* Outer card — rounded-3xl with drop shadow */}
      <div className="flex rounded-3xl shadow-2xl overflow-hidden bg-white min-h-[580px]">

        {/* ─── LEFT: Form panel ──────────────────────────────────────── */}
        <div className="w-full md:w-[45%] flex flex-col px-10 py-10">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "hsl(245 86% 82% / 0.15)" }}>
              <Zap className="h-4 w-4" style={{ color: "hsl(245 70% 55%)" }} />
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-800">Synchro</span>
          </div>

          {/* Heading */}
          <div className="mt-10 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-gray-400 mt-1.5">
              Enter your email and password to access your account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="admin@gmail.com"
                value={values.email}
                onChange={handleChange}
                disabled={isLoading}
                className={`h-11 rounded-lg border px-3.5 text-sm bg-white text-gray-800 placeholder-gray-400
                  outline-none transition-all focus:border-[hsl(245_70%_55%)] focus:ring-2 focus:ring-[hsl(245_86%_82%/0.25)]
                  ${errors.email ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={values.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-11 w-full rounded-lg border px-3.5 pr-11 text-sm bg-white text-gray-800 placeholder-gray-400
                    outline-none transition-all focus:border-[hsl(245_70%_55%)] focus:ring-2 focus:ring-[hsl(245_86%_82%/0.25)]
                    ${errors.password ? "border-red-400" : "border-gray-200"}`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0
                    ${rememberMe
                      ? "border-[hsl(245_70%_55%)] bg-[hsl(245_70%_55%)]"
                      : "border-gray-300 bg-white group-hover:border-[hsl(245_70%_55%)]"}`}
                >
                  {rememberMe && (
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-xs text-gray-500">Remember Me</span>
              </label>
              <button type="button" className="text-xs font-medium transition-colors"
                style={{ color: "hsl(245 70% 55%)" }}>
                Forgot Your Password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 h-11 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              style={{ background: "hsl(245 70% 55%)" }}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
              ) : "Log In"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">Or Login With</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Social buttons (decorative) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="h-10 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                {/* Google G */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="h-10 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                {/* Apple */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-auto pt-8 flex items-center justify-between text-xs text-gray-400">
            <span>Copyright © 2025 Synchro. All rights reserved.</span>
            <button type="button" className="hover:underline">Privacy Policy</button>
          </div>
        </div>

        {/* ─── RIGHT: Brand panel ─────────────────────────────────────── */}
        <div
          className="hidden md:flex md:w-[55%] flex-col justify-between p-10 relative overflow-hidden"
          style={{ background: "hsl(248 30% 18%)" }}
        >
          {/* Background glow blobs */}
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full opacity-20"
            style={{ background: "hsl(245 86% 75%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full opacity-10"
            style={{ background: "hsl(245 86% 82%)", filter: "blur(50px)" }} />

          {/* Heading */}
          <div className="relative z-10 mt-8">
            <h2 className="text-3xl font-bold text-white leading-snug max-w-sm">
              Effortlessly manage your team and operations.
            </h2>
            <p className="text-sm mt-3 max-w-xs" style={{ color: "hsl(240 15% 70%)" }}>
              Log in to access your PM dashboard, manage projects, and collaborate with your team.
            </p>
          </div>

          {/* Dashboard mockup cards */}
          <div className="relative z-10 mt-10 flex-1 flex items-center">
            <div className="w-full space-y-2.5">

              {/* Top row — 3 stat cards */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "Active Projects", value: "6", color: "hsl(245 86% 75%)" },
                  { label: "Total Tasks", value: "142", color: "hsl(180 50% 60%)" },
                  { label: "Completed", value: "89%", color: "hsl(145 60% 55%)" },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl bg-white/10 backdrop-blur p-3 border border-white/10">
                    <p className="text-[10px] text-white/50 mb-1">{card.label}</p>
                    <p className="text-lg font-bold" style={{ color: card.color }}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Chart placeholder */}
              <div className="rounded-xl bg-white/10 backdrop-blur p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-white/70">Task Completion Trend</p>
                  <span className="text-[10px] text-white/40 bg-white/10 px-2 py-0.5 rounded-full">Weekly</span>
                </div>
                {/* Fake bar chart */}
                <div className="flex items-end gap-1.5 h-14">
                  {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm transition-all"
                      style={{
                        height: `${h}%`,
                        background: i === 5
                          ? "hsl(245 86% 75%)"
                          : "hsl(245 86% 75% / 0.35)",
                      }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                    <span key={d} className="text-[9px] text-white/30 flex-1 text-center">{d}</span>
                  ))}
                </div>
              </div>

              {/* Bottom row — project list mockup */}
              <div className="rounded-xl bg-white/10 backdrop-blur border border-white/10 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                  <p className="text-xs font-medium text-white/70">Active Projects</p>
                  <span className="text-[10px] text-white/40">View all →</span>
                </div>
                {[
                  { name: "BRI — Internet Banking", progress: 68, color: "#818cf8" },
                  { name: "BCA — Core Banking T24", progress: 42, color: "#34d399" },
                  { name: "BSI — Mobile Super App", progress: 29, color: "#fb923c" },
                ].map((p) => (
                  <div key={p.name} className="px-4 py-2.5 flex items-center gap-3 border-b border-white/5 last:border-0">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
                    <p className="text-xs text-white/70 flex-1 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.color }} />
                      </div>
                      <span className="text-[10px] text-white/50 w-7 text-right">{p.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Bottom tagline */}
          <div className="relative z-10 mt-6">
            <p className="text-xs" style={{ color: "hsl(240 15% 55%)" }}>
              Don&apos;t have an account?{" "}
              <span className="font-semibold cursor-pointer hover:underline" style={{ color: "hsl(245 86% 78%)" }}>
                Contact your administrator.
              </span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
