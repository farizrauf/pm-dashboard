"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Shield, Fingerprint } from "lucide-react";
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
  const [rememberMe, setRememberMe] = useState(true);
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
    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[540px]">
      {/* ── LEFT PANEL — Form ─────────────────────────────── */}
      <div className="w-full md:w-1/2 p-10 flex flex-col justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-violet-600" />
          <span className="text-sm font-bold text-gray-800 tracking-wide">Synchro</span>
        </div>

        {/* Heading */}
        <div className="mt-8">
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
            Holla,<br />Welcome Back
          </h1>
          <p className="text-sm text-gray-400 mt-2">Hey, welcome back to your special place</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 flex-1">
          {/* Email */}
          <div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@gmail.com"
              value={values.email}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full h-11 px-4 rounded-lg border text-sm bg-white text-gray-800 placeholder-gray-400 outline-none transition-all
                focus:border-violet-500 focus:ring-2 focus:ring-violet-100
                ${errors.email ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
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
                className={`w-full h-11 px-4 pr-11 rounded-lg border text-sm bg-white text-gray-800 placeholder-gray-400 outline-none transition-all
                  focus:border-violet-500 focus:ring-2 focus:ring-violet-100
                  ${errors.password ? "border-red-400" : "border-gray-300"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* Remember me + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`h-4 w-4 rounded flex items-center justify-center transition-colors cursor-pointer
                  ${rememberMe ? "bg-violet-600" : "border border-gray-300 bg-white"}`}
              >
                {rememberMe && (
                  <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-gray-500">Remember me</span>
            </label>
            <button type="button" className="text-gray-400 hover:text-violet-600 transition-colors text-xs">
              Forgot Password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-fit px-8 h-11 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-xs text-gray-400">
          Don&apos;t have an account?{" "}
          <span className="text-violet-600 font-semibold cursor-pointer hover:underline">
            Sign Up
          </span>
        </p>
      </div>

      {/* ── RIGHT PANEL — Illustration ────────────────────── */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 relative items-center justify-center overflow-hidden rounded-r-3xl">
        {/* Cloud decorations */}
        <div className="absolute top-6 left-4 w-20 h-10 bg-white/20 rounded-full blur-sm" />
        <div className="absolute top-14 right-6 w-16 h-8 bg-white/20 rounded-full blur-sm" />
        <div className="absolute bottom-10 left-6 w-24 h-10 bg-white/20 rounded-full blur-sm" />
        <div className="absolute bottom-20 right-4 w-16 h-8 bg-white/20 rounded-full blur-sm" />

        {/* Phone illustration */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Phone frame */}
          <div className="relative w-40 h-72 bg-gray-900 rounded-[2.5rem] border-4 border-gray-800 shadow-2xl overflow-hidden">
            {/* Phone screen */}
            <div className="absolute inset-1 bg-gradient-to-b from-pink-300 to-purple-400 rounded-[2rem] flex flex-col items-center justify-center gap-3 p-3">
              {/* Fingerprint icon */}
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center">
                <Fingerprint className="h-9 w-9 text-white/80" />
              </div>
              {/* Progress bar */}
              <div className="w-20 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-white rounded-full" />
              </div>
              <p className="text-[9px] text-white/70 text-center leading-tight">
                Please tap your finger<br />to your phone
              </p>
              {/* Top bar icons */}
              <div className="absolute top-3 right-3 flex flex-col gap-1">
                <div className="w-3 h-0.5 bg-white/60 rounded" />
                <div className="w-3 h-0.5 bg-white/60 rounded" />
                <div className="w-2 h-0.5 bg-white/60 rounded" />
              </div>
            </div>
          </div>

          {/* Lock icon — right side */}
          <div className="absolute -right-12 top-8 w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg">
            <Lock className="h-7 w-7 text-white" />
          </div>

          {/* Check badge — left side */}
          <div className="absolute -left-10 top-4 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center">
            <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-violet-600" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Shield — bottom left */}
          <div className="absolute -left-8 bottom-8 w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Walking person illustration (SVG) */}
        <div className="absolute bottom-4 left-4 opacity-90">
          <svg width="110" height="130" viewBox="0 0 110 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Body */}
            <ellipse cx="55" cy="30" rx="10" ry="12" fill="#1a1a2e" />
            {/* Yellow jacket */}
            <path d="M35 55 Q40 42 55 45 Q70 42 75 55 L72 85 H38 Z" fill="#f5c518" />
            {/* Arms */}
            <path d="M38 55 Q25 65 22 78" stroke="#f5c518" strokeWidth="10" strokeLinecap="round" />
            <path d="M72 55 Q85 50 90 40" stroke="#f5c518" strokeWidth="10" strokeLinecap="round" />
            {/* White pants */}
            <path d="M38 85 L33 118 H48 L55 98 L62 118 H77 L72 85 Z" fill="#f0f0f0" />
            {/* Shoes */}
            <ellipse cx="36" cy="120" rx="12" ry="5" fill="#2d2d3e" />
            <ellipse cx="74" cy="120" rx="12" ry="5" fill="#2d2d3e" />
            {/* Bag strap */}
            <path d="M38 55 Q30 70 35 85" stroke="#8B6914" strokeWidth="4" strokeLinecap="round" />
            <rect x="20" y="78" width="18" height="22" rx="4" fill="#8B6914" />
          </svg>
        </div>
      </div>
    </div>
  );
}
