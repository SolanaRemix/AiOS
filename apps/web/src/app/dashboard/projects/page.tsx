"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Grid3X3,
  List,
  FolderOpen,
  MoreVertical,
  Code2,
  Clock,
  Bot,
  Trash2,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Project } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

const PROJECT_LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "Other",
];

const createProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  language: z.string().min(1, "Please select a language"),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    name: "AI Code Assistant",
    description: "Intelligent code completion and review system powered by GPT-4o",
    tenantId: "t1",
    status: "active",
    language: "TypeScript",
    agentCount: 4,
    lastActivity: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["AI", "Code", "GPT-4"],
  },
  {
    id: "2",
    name: "Data Pipeline Builder",
    description: "Automated ETL pipeline creation with AI-generated transformations",
    tenantId: "t1",
    status: "active",
    language: "Python",
    agentCount: 3,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Data", "ETL", "Python"],
  },
  {
    id: "3",
    name: "API Security Auditor",
    description: "Automated security vulnerability scanning for REST APIs",
    tenantId: "t1",
    status: "paused",
    language: "Go",
    agentCount: 2,
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Security", "API", "Audit"],
  },
  {
    id: "4",
    name: "Documentation Generator",
    description: "Auto-generates technical docs from source code using AI agents",
    tenantId: "t1",
    status: "active",
    language: "JavaScript",
    agentCount: 2,
    lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Docs", "Automation"],
  },
  {
    id: "5",
    name: "ML Model Trainer",
    description: "Automated machine learning pipeline with hyperparameter optimization",
    tenantId: "t1",
    status: "archived",
    language: "Python",
    agentCount: 5,
    lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["ML", "Training", "Python"],
  },
  {
    id: "6",
    name: "Cloud Cost Optimizer",
    description: "AI-driven cloud resource optimization and cost reduction",
    tenantId: "t1",
    status: "active",
    language: "TypeScript",
    agentCount: 3,
    lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Cloud", "Cost", "DevOps"],
  },
];

const statusStyles: Record<string, string> = {
  active: "success",
  paused: "warning",
  archived: "outline",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { language: "TypeScript" },
  });

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onCreateProject = async (data: CreateProjectForm) => {
    await new Promise((r) => setTimeout(r, 500));
    const newProject: Project = {
      id: String(Date.now()),
      ...data,
      description: data.description || "",
      tenantId: "t1",
      status: "active",
      agentCount: 0,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };
    setProjects([newProject, ...projects]);
    setIsCreateOpen(false);
    reset();
    toast.success("Project created successfully!");
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    toast.success("Project deleted");
    setOpenMenuId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-white">Projects</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {projects.length} total · {projects.filter((p) => p.status === "active").length} active
          </p>
        </div>
        <Button variant="neon" size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          New Project
        </Button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search projects..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "active", "paused", "archived"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                statusFilter === status
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-white/40 hover:text-white/70 border border-white/8"
              }`}
            >
              {status}
            </button>
          ))}
          <div className="flex border border-white/10 rounded-lg overflow-hidden ml-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40">No projects found</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsCreateOpen(true)}>
            Create your first project
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 group hover:border-primary/20 transition-all duration-300 relative"
            >
              {/* Menu */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenMenuId(openMenuId === project.id ? null : project.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openMenuId === project.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 glass-card rounded-lg border border-white/10 shadow-glass-lg overflow-hidden z-20">
                    <Link href={`/dashboard/projects/${project.id}`} onClick={() => setOpenMenuId(null)}>
                      <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white">
                        <ExternalLink className="w-3.5 h-3.5" /> Open
                      </button>
                    </Link>
                    <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white">
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>

              <Link href={`/dashboard/projects/${project.id}`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Code2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className="font-semibold text-white/90 truncate">{project.name}</h3>
                    <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{project.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge variant={statusStyles[project.status] as "success" | "warning" | "outline"} className="text-[10px]">
                    {project.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{project.language}</Badge>
                  {project.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-white/30 pt-3 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Bot className="w-3 h-3" /> {project.agentCount} agents
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatRelativeTime(project.lastActivity)}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Project</th>
                <th className="text-left">Status</th>
                <th className="text-left">Language</th>
                <th className="text-left">Agents</th>
                <th className="text-left">Last Active</th>
                <th className="text-left"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id} className="hover:bg-white/2">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Code2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/90">{project.name}</p>
                        <p className="text-xs text-white/30 truncate max-w-48">{project.description}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={statusStyles[project.status] as "success" | "warning" | "outline"} className="text-[10px] capitalize">
                      {project.status}
                    </Badge>
                  </td>
                  <td className="text-sm text-white/60">{project.language}</td>
                  <td className="text-sm text-white/60">{project.agentCount}</td>
                  <td className="text-sm text-white/60">{formatRelativeTime(project.lastActivity)}</td>
                  <td>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <Button variant="ghost" size="sm">Open →</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateProject)} className="space-y-4 mt-4">
            <Input
              label="Project name"
              placeholder="My Awesome Project"
              error={errors.name?.message}
              {...register("name")}
            />
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Description (optional)
              </label>
              <textarea
                placeholder="What does this project do?"
                className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 resize-none"
                {...register("description")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Language</label>
              <select
                className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white/80 focus:outline-none focus:border-primary/30"
                {...register("language")}
              >
                {PROJECT_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang} className="bg-[#0d0d1a]">
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="neon" loading={isSubmitting}>
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
