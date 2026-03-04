"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { User, Mail, Lock, Building2, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
  company: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const PASSWORD_REQUIREMENTS = [
  { test: (v: string) => v.length >= 8, label: "At least 8 characters" },
  { test: (v: string) => /[A-Z]/.test(v), label: "One uppercase letter" },
  { test: (v: string) => /[0-9]/.test(v), label: "One number" },
];

export default function RegisterPage() {
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        company: data.company,
      });
    } catch {
      // error handled in store
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="glass-card rounded-2xl border border-white/10 p-8 shadow-glass-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white mb-2">Create your account</h1>
          <p className="text-white/50 text-sm">Join AIOS and start building with AI</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full name"
            type="text"
            placeholder="John Smith"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Email address"
            type="email"
            placeholder="you@company.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Company (optional)"
            type="text"
            placeholder="Acme Corp"
            leftIcon={<Building2 className="w-4 h-4" />}
            error={errors.company?.message}
            {...register("company")}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register("password")}
            />

            {/* Password requirements */}
            {watchedPassword && (
              <div className="mt-2 space-y-1">
                {PASSWORD_REQUIREMENTS.map((req) => (
                  <div key={req.label} className="flex items-center gap-1.5">
                    <CheckCircle
                      className={`w-3 h-3 ${
                        req.test(watchedPassword) ? "text-green-400" : "text-white/20"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        req.test(watchedPassword) ? "text-green-400" : "text-white/30"
                      }`}
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-primary flex-shrink-0"
              />
              <span className="text-xs text-white/50">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:text-primary/80">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-primary hover:text-primary/80">Privacy Policy</Link>
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full"
            loading={isLoading}
          >
            {!isLoading && (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
