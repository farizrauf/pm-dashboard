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
      } else if (res?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Connection error. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* Outer wrapper — slightly smaller max-width, less rounded */
    <div className="w-full max-w-4xl">
      <div className="flex rounded-xl shadow-xl overflow-hidden bg-white" style={{ minHeight: 520 }}>

        {/* ─── LEFT: Form ─────────────────────────────────────────── */}
        <div className="w-full md:w-[42%] flex flex-col px-8 py-8">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: "hsl(245 86% 82% / 0.15)" }}>
              <Zap className="h-3.5 w-3.5" style={{ color: "hsl(245 70% 55%)" }} />
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-800">Synchro</span>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
            <p className="text-xs text-gray-400 mt-1">
              Enter your email and password to access your account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
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
                className={`h-9 rounded-md border px-3 text-sm bg-white text-gray-800 placeholder-gray-400
                  outline-none transition-all focus:border-[hsl(245_70%_55%)] focus:ring-2 focus:ring-[hsl(245_86%_82%/0.2)]
                  ${errors.email ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
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
                  className={`h-9 w-full rounded-md border px-3 pr-10 text-sm bg-white text-gray-800 placeholder-gray-400
                    outline-none transition-all focus:border-[hsl(245_70%_55%)] focus:ring-2 focus:ring-[hsl(245_86%_82%/0.2)]
                    ${errors.password ? "border-red-400" : "border-gray-200"}`}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                <button type="button" onClick={() => setRememberMe(!rememberMe)}
                  className={`h-3.5 w-3.5 rounded-sm border flex items-center justify-center transition-colors shrink-0
                    ${rememberMe ? "border-[hsl(245_70%_55%)] bg-[hsl(245_70%_55%)]" : "border-gray-300 bg-white"}`}>
                  {rememberMe && (
                    <svg className="h-2 w-2 text-white" viewBox="0 0 12 12" fill="none">
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
            <button type="submit" disabled={isLoading}
              className="mt-1 h-9 rounded-md text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              style={{ background: "hsl(245 70% 55%)" }}>
              {isLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing in...</> : "Log In"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-auto pt-6 flex items-center justify-between text-[10px] text-gray-400">
            <span>Copyright © 2025 Synchro. All rights reserved.</span>
            <button type="button" className="hover:underline">Privacy Policy</button>
          </div>
        </div>

        {/* ─── RIGHT: Brand panel ─────────────────────────────────── */}
        <div className="hidden md:flex md:w-[58%] flex-col justify-between p-8 relative overflow-hidden"
          style={{ background: "hsl(248 30% 18%)" }}>

          {/* Glow blobs */}
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-20"
            style={{ background: "hsl(245 86% 75%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full opacity-10"
            style={{ background: "hsl(245 86% 82%)", filter: "blur(50px)" }} />

          {/* Heading */}
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white leading-snug max-w-xs">
              Effortlessly manage your team and operations.
            </h2>
            <p className="text-xs mt-2 max-w-xs" style={{ color: "hsl(240 15% 65%)" }}>
              Log in to access your PM dashboard, manage projects, and collaborate with your team.
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="relative z-10 mt-6 flex-1 flex items-center">
            <div className="w-full space-y-2">

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "On-Time Delivery", value: "94%", color: "hsl(245 86% 75%)" },
                  { label: "Tasks Completed", value: "1,240", color: "hsl(180 50% 60%)" },
                  { label: "Team Velocity", value: "+18%", color: "hsl(145 60% 55%)" },
                ].map((card) => (
                  <div key={card.label} className="rounded-lg bg-white/10 backdrop-blur p-2.5 border border-white/10">
                    <p className="text-[9px] text-white/50 mb-0.5">{card.label}</p>
                    <p className="text-base font-bold" style={{ color: card.color }}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="rounded-lg bg-white/10 backdrop-blur p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium text-white/70">Task Completion Trend</p>
                  <span className="text-[9px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded">Weekly</span>
                </div>
                <div className="flex items-end gap-1 h-10">
                  {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm"
                      style={{
                        height: `${h}%`,
                        background: i === 5 ? "hsl(245 86% 75%)" : "hsl(245 86% 75% / 0.35)",
                      }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                    <span key={d} className="text-[8px] text-white/30 flex-1 text-center">{d}</span>
                  ))}
                </div>
              </div>

              {/* Features / persuasive list */}
              <div className="rounded-lg bg-white/10 backdrop-blur border border-white/10 overflow-hidden">
                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                  <p className="text-[10px] font-medium text-white/70">Why teams love Synchro</p>
                </div>
                {[
                  { icon: "⚡", title: "Ship faster", desc: "Cut delivery time by up to 40%" },
                  { icon: "📊", title: "Full visibility", desc: "Real-time progress across all projects" },
                  { icon: "🤝", title: "Seamless collaboration", desc: "Everyone aligned, always in sync" },
                ].map((item) => (
                  <div key={item.title} className="px-3 py-2 flex items-center gap-2.5 border-b border-white/5 last:border-0">
                    <span className="text-sm shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-white/80 truncate">{item.title}</p>
                      <p className="text-[9px] text-white/45 truncate">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Bottom */}
          <div className="relative z-10 mt-4">
            <p className="text-[10px]" style={{ color: "hsl(240 15% 50%)" }}>
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
