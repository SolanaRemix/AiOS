"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Globe,
  UserPlus,
  Sparkles,
  Clock,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TimelinePost {
  id: string;
  author: { name: string; avatar: string };
  title: string;
  description: string;
  category: string;
  tags: string[];
  likes: number;
  isLiked: boolean;
  price: number;
  createdAt: string;
}

const MOCK_POSTS: TimelinePost[] = [
  {
    id: "p1",
    author: { name: "Alice Chen", avatar: "AC" },
    title: "Advanced Solidity Auditor",
    description: "Deep-dive smart contract security prompt. Detects reentrancy, overflow, and MEV vectors.",
    category: "security",
    tags: ["solidity", "audit", "defi"],
    likes: 142,
    isLiked: false,
    price: 0,
    createdAt: "2h ago",
  },
  {
    id: "p2",
    author: { name: "Bob Martinez", avatar: "BM" },
    title: "Rust Performance Optimizer",
    description: "Analyse Rust code for cache-miss patterns, unnecessary allocations, and async anti-patterns.",
    category: "performance",
    tags: ["rust", "performance", "async"],
    likes: 89,
    isLiked: true,
    price: 4.99,
    createdAt: "5h ago",
  },
  {
    id: "p3",
    author: { name: "Dev DAO", avatar: "DD" },
    title: "Next.js 15 App Router Scaffold",
    description: "Generate a full Next.js 15 production scaffold with auth, DB, and CI in one shot.",
    category: "frontend",
    tags: ["nextjs", "typescript", "scaffold"],
    likes: 312,
    isLiked: false,
    price: 9.99,
    createdAt: "1d ago",
  },
  {
    id: "p4",
    author: { name: "Crypto Whale", avatar: "CW" },
    title: "DeFi Arbitrage Strategy Builder",
    description: "Design cross-DEX arbitrage strategies with slippage analysis and profit projections.",
    category: "defi",
    tags: ["defi", "arbitrage", "solana"],
    likes: 207,
    isLiked: false,
    price: 0,
    createdAt: "2d ago",
  },
];

const CATEGORIES = ["All", "security", "performance", "frontend", "defi", "backend", "ai"];

export default function SocialTimelinePage() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          Community Timeline
        </h1>
        <p className="text-white/40 text-sm mt-0.5">
          Discover and share AI prompts from the community
        </p>
      </motion.div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search prompts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filtered.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card glass className="hover:border-primary/30 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                      {post.author.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{post.author.name}</p>
                      <p className="text-xs text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.price === 0 ? (
                      <Badge variant="success" className="text-[10px]">Free</Badge>
                    ) : (
                      <Badge variant="neon-purple" className="text-[10px]">${post.price}</Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] capitalize">{post.category}</Badge>
                  </div>
                </div>
                <CardTitle className="text-base mt-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary/60" />
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/60 mb-3">{post.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-[10px] text-white/40 bg-white/5 rounded px-2 py-0.5"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs transition-all ${
                      post.isLiked ? "text-pink-400" : "text-white/40 hover:text-pink-400"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.isLiked ? "fill-current" : ""}`} />
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-primary transition-all">
                    <MessageCircle className="w-4 h-4" />
                    Reply
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-primary transition-all">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <div className="ml-auto">
                    <Button
                      variant={post.price === 0 ? "outline" : "gradient"}
                      size="sm"
                      className="text-xs h-7"
                    >
                      {post.price === 0 ? "Use Prompt" : `Buy $${post.price}`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No prompts found</p>
          </div>
        )}
      </div>

      {/* Follow suggestions */}
      <Card glass>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Suggested Creators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {["@solana_dev", "@ai_builder", "@defi_quant"].map((handle) => (
              <div key={handle} className="flex items-center justify-between p-3 rounded-lg bg-white/3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                    {handle.slice(1, 3).toUpperCase()}
                  </div>
                  <span className="text-xs text-white/70">{handle}</span>
                </div>
                <Button variant="outline" size="sm" className="text-[10px] h-6 px-2">Follow</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
