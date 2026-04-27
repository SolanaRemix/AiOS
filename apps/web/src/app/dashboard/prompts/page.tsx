"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  BookOpen,
  Lock,
  Globe,
  Edit2,
  Trash2,
  Heart,
  Eye,
  DollarSign,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

const promptSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  description: z.string().max(1000).optional(),
  category: z.string().default("general"),
  visibility: z.enum(["public", "private"]).default("private"),
  price: z.coerce.number().min(0).default(0),
  tags: z.string().optional(),
});

type PromptForm = z.infer<typeof promptSchema>;

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  visibility: "public" | "private";
  price: number;
  likes: number;
  views: number;
  tags: string[];
  createdAt: string;
}

const MOCK_PROMPTS: Prompt[] = [
  {
    id: "1",
    title: "TypeScript Code Reviewer",
    description: "Reviews TypeScript code for best practices, type safety, and performance.",
    content: "You are an expert TypeScript code reviewer...",
    category: "development",
    visibility: "public",
    price: 0,
    likes: 45,
    views: 312,
    tags: ["typescript", "code-review"],
    createdAt: "3d ago",
  },
  {
    id: "2",
    title: "DeFi Protocol Auditor",
    description: "Audits Solidity smart contracts for security vulnerabilities.",
    content: "You are a DeFi security expert...",
    category: "security",
    visibility: "public",
    price: 9.99,
    likes: 128,
    views: 850,
    tags: ["solidity", "defi", "security"],
    createdAt: "1w ago",
  },
  {
    id: "3",
    title: "Private Research Template",
    description: "Personal research assistant for competitive analysis.",
    content: "This is a private prompt for my research workflow...",
    category: "research",
    visibility: "private",
    price: 0,
    likes: 0,
    views: 0,
    tags: ["research"],
    createdAt: "2w ago",
  },
];

export default function PromptsPage() {
  const [prompts, setPrompts] = useState(MOCK_PROMPTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<PromptForm>({
      resolver: zodResolver(promptSchema),
    });

  const openCreate = () => {
    setEditingPrompt(null);
    reset({ visibility: "private", price: 0, category: "general" });
    setIsDialogOpen(true);
  };

  const openEdit = (p: Prompt) => {
    setEditingPrompt(p);
    reset({
      title: p.title,
      content: p.content,
      description: p.description,
      category: p.category,
      visibility: p.visibility,
      price: p.price,
      tags: p.tags.join(", "),
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: PromptForm) => {
    const tags = data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    if (editingPrompt) {
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === editingPrompt.id
            ? { ...p, ...data, tags }
            : p
        )
      );
      toast.success("Prompt updated");
    } else {
      const newPrompt: Prompt = {
        id: String(Date.now()),
        ...data,
        tags,
        description: data.description ?? "",
        likes: 0,
        views: 0,
        createdAt: "just now",
      };
      setPrompts((prev) => [newPrompt, ...prev]);
      toast.success("Prompt created");
    }
    setIsDialogOpen(false);
  };

  const deletePrompt = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Prompt deleted");
  };

  const toggleVisibility = (id: string) => {
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, visibility: p.visibility === "public" ? "private" : "public" }
          : p
      )
    );
  };

  const stats = {
    total: prompts.length,
    public: prompts.filter((p) => p.visibility === "public").length,
    totalLikes: prompts.reduce((a, p) => a + p.likes, 0),
    totalViews: prompts.reduce((a, p) => a + p.views, 0),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            My Prompts
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            Create, manage, and monetise your AI prompts
          </p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          New Prompt
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total",  value: stats.total,      icon: BookOpen,    color: "text-primary" },
          { label: "Public", value: stats.public,      icon: Globe,       color: "text-green-400" },
          { label: "Likes",  value: stats.totalLikes,  icon: Heart,       color: "text-pink-400" },
          { label: "Views",  value: stats.totalViews,  icon: Eye,         color: "text-blue-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} glass>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prompts list */}
      <div className="space-y-3">
        {prompts.map((prompt, i) => (
          <motion.div
            key={prompt.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card glass className="hover:border-primary/20 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{prompt.title}</h3>
                      {prompt.visibility === "public" ? (
                        <Badge variant="success" className="text-[10px] flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Private
                        </Badge>
                      )}
                      {prompt.price > 0 && (
                        <Badge variant="neon-purple" className="text-[10px]">
                          <DollarSign className="w-2.5 h-2.5" />{prompt.price}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mb-2 line-clamp-2">{prompt.description}</p>
                    <div className="flex items-center gap-3 text-xs text-white/30">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{prompt.likes}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{prompt.views}</span>
                      <span className="capitalize bg-white/5 px-2 py-0.5 rounded">{prompt.category}</span>
                      <span>{prompt.createdAt}</span>
                    </div>
                    {prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prompt.tags.map((t) => (
                          <span key={t} className="flex items-center gap-0.5 text-[10px] text-white/30 bg-white/5 rounded px-1.5 py-0.5">
                            <Tag className="w-2 h-2" />{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => toggleVisibility(prompt.id)}
                    >
                      {prompt.visibility === "public" ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => openEdit(prompt)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-400 hover:text-red-300"
                      onClick={() => deletePrompt(prompt.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {prompts.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No prompts yet. Create your first one!</p>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? "Edit Prompt" : "Create Prompt"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs text-white/60 mb-1 block">Title *</label>
              <Input {...register("title")} placeholder="e.g. TypeScript Code Reviewer" />
              {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Description</label>
              <Input {...register("description")} placeholder="Short description" />
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Prompt Content *</label>
              <textarea
                {...register("content")}
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 resize-none"
                placeholder="You are an expert..."
              />
              {errors.content && <p className="text-xs text-red-400 mt-1">{errors.content.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Category</label>
                <select
                  {...register("category")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                >
                  {["general", "development", "security", "research", "defi", "frontend", "backend"].map((c) => (
                    <option key={c} value={c} className="bg-gray-900">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Visibility</label>
                <select
                  {...register("visibility")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                >
                  <option value="private" className="bg-gray-900">Private</option>
                  <option value="public" className="bg-gray-900">Public</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Price (USD, 0 = free)</label>
                <Input {...register("price")} type="number" min="0" step="0.01" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Tags (comma-separated)</label>
                <Input {...register("tags")} placeholder="typescript, review" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient">
                {editingPrompt ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
