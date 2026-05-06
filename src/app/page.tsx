"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Layers, Zap, Users } from "lucide-react";
import { GlassLayout } from "@/components/layout/GlassLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

// Mock task cards for the dashboard preview
const mockTasks = [
  { id: 1, title: "Brand Identity Refresh", tag: "Design", color: "bg-velora-cyan" },
  { id: 2, title: "Product Photography", tag: "Review", color: "bg-velora-pink" },
  { id: 3, title: "Social Media Assets", tag: "In Progress", color: "bg-velora-purple" },
];

const mockColumns = [
  { title: "To Do", count: 4 },
  { title: "In Progress", count: 3 },
  { title: "Review", count: 2 },
];

export default function LandingPage() {
  return (
    <GlassLayout>
      <div className="relative min-h-screen">
        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed left-0 right-0 top-0 z-50 p-6"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-velora-cyan to-velora-pink">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Velora</span>
            </div>

            {/* Nav Links */}
            <GlassPanel intensity="light" className="hidden items-center gap-8 px-6 py-3 md:flex">
              <a href="#" className="text-sm text-velora-text-muted transition-colors hover:text-white">
                Features
              </a>
              <a href="#" className="text-sm text-velora-text-muted transition-colors hover:text-white">
                Pricing
              </a>
              <a href="#" className="text-sm text-velora-text-muted transition-colors hover:text-white">
                About
              </a>
            </GlassPanel>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="px-4 py-2 text-sm text-velora-text-muted transition-colors hover:text-white"
              >
                Log in
              </a>
              <a
                href="/signup"
                className="rounded-lg bg-gradient-to-r from-velora-cyan to-velora-pink px-5 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-velora-cyan/25"
              >
                Get Started
              </a>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-7xl text-center"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-8 inline-flex">
              <GlassPanel intensity="light" className="flex items-center gap-2 px-4 py-2">
                <Sparkles className="h-4 w-4 text-velora-cyan" />
                <span className="text-sm text-velora-text-muted">
                  The future of creative workflows
                </span>
              </GlassPanel>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={itemVariants}
              className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl"
            >
              Where Ideas{" "}
              <span className="bg-gradient-to-r from-velora-cyan via-velora-purple to-velora-pink bg-clip-text text-transparent">
                Flow Freely
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={itemVariants}
              className="mx-auto mb-12 max-w-2xl text-lg text-velora-text-muted md:text-xl"
            >
              A beautiful workspace designed for visual artists and creative teams.
              Organize projects, collaborate seamlessly, and bring your vision to life.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/signup"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-velora-cyan to-velora-pink px-8 py-4 font-semibold text-white transition-all hover:scale-105 hover:shadow-xl hover:shadow-velora-cyan/30"
              >
                Start Creating
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <GlassPanel
                hoverable
                intensity="light"
                className="cursor-pointer px-8 py-4 font-semibold text-white"
              >
                Watch Demo
              </GlassPanel>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              variants={itemVariants}
              className="relative mt-20"
            >
              <motion.div
                variants={floatVariants}
                initial="initial"
                animate="animate"
              >
                <GlassPanel
                  intensity="medium"
                  className="mx-auto max-w-5xl overflow-hidden p-6"
                >
                  {/* Dashboard Header */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-velora-cyan to-velora-purple">
                        <Layers className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Brand Campaign 2024</h3>
                        <p className="text-xs text-velora-text-subtle">12 tasks • 5 team members</p>
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-velora-dark bg-gradient-to-br from-velora-cyan/50 to-velora-pink/50 text-xs font-medium text-white"
                        >
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kanban Columns Preview */}
                  <div className="grid grid-cols-3 gap-4">
                    {mockColumns.map((column, colIndex) => (
                      <GlassPanel key={column.title} intensity="light" className="p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-velora-text-muted">
                            {column.title}
                          </h4>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs text-velora-text-subtle">
                            {column.count}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {mockTasks.slice(0, colIndex === 1 ? 3 : 2).map((task, i) => (
                            <GlassPanel
                              key={`${column.title}-${i}`}
                              intensity="light"
                              hoverable
                              className="cursor-pointer p-3"
                            >
                              <span
                                className={`mb-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${i === 0 ? "bg-velora-cyan/20 text-velora-cyan" :
                                  i === 1 ? "bg-velora-pink/20 text-velora-pink" :
                                    "bg-velora-purple/20 text-velora-purple"
                                  }`}
                              >
                                {task.tag}
                              </span>
                              <p className="text-sm text-white">{task.title}</p>
                            </GlassPanel>
                          ))}
                        </div>
                      </GlassPanel>
                    ))}
                  </div>
                </GlassPanel>
              </motion.div>

              {/* Decorative gradient glow behind preview */}
              <div className="pointer-events-none absolute -bottom-20 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-velora-cyan/20 blur-[80px]" />
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-7xl"
          >
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Built for Creative Excellence
              </h2>
              <p className="mx-auto max-w-xl text-velora-text-muted">
                Everything you need to manage creative projects with elegance and precision.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Layers,
                  title: "Visual Kanban",
                  description: "Drag and drop tasks with beautiful, glass-effect cards that make organization a pleasure.",
                  gradient: "from-velora-cyan to-blue-500",
                },
                {
                  icon: Zap,
                  title: "Real-time Sync",
                  description: "Changes appear instantly across all devices. Collaborate without missing a beat.",
                  gradient: "from-velora-pink to-rose-500",
                },
                {
                  icon: Users,
                  title: "Team Spaces",
                  description: "Create dedicated workspaces for different projects or clients. Stay organized effortlessly.",
                  gradient: "from-velora-purple to-indigo-500",
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                >
                  <GlassPanel hoverable intensity="medium" className="h-full p-8">
                    <div
                      className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient}`}
                    >
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="leading-relaxed text-velora-text-muted">
                      {feature.description}
                    </p>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <GlassPanel intensity="heavy" className="relative mx-auto max-w-4xl overflow-hidden p-12 text-center md:p-16">
              {/* Background gradient accent */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-velora-cyan/30 blur-[60px]" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-velora-pink/30 blur-[60px]" />

              <div className="relative z-10">
                <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                  Ready to Transform Your Workflow?
                </h2>
                <p className="mx-auto mb-8 max-w-lg text-velora-text-muted">
                  Join thousands of creative professionals who have already elevated their project management.
                </p>
                <a
                  href="/signup"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-velora-cyan to-velora-pink px-10 py-4 font-semibold text-white transition-all hover:scale-105 hover:shadow-xl hover:shadow-velora-cyan/30"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </GlassPanel>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 py-12">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-velora-cyan to-velora-pink">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">Velora</span>
            </div>
            <p className="text-sm text-velora-text-subtle">
              © 2024 Velora. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </GlassLayout>
  );
}
