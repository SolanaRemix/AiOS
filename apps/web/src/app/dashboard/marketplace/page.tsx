"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Search,
  Star,
  Heart,
  Eye,
  DollarSign,
  Filter,
  Sparkles,
  TrendingUp,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  author: string;
  authorAvatar: string;
  category: string;
  tags: string[];
  price: number;
  rating: number;
  sales: number;
  likes: number;
  views: number;
  isFeatured: boolean;
  isLiked: boolean;
}

const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: "m1",
    title: "Ultimate Solidity Security Auditor",
    description: "Comprehensive smart contract auditor covering reentrancy, overflow, front-running, and MEV attacks. Includes fix suggestions.",
    author: "0xSecurity",
    authorAvatar: "0S",
    category: "security",
    tags: ["solidity", "audit", "defi", "ethereum"],
    price: 19.99,
    rating: 4.9,
    sales: 342,
    likes: 891,
    views: 12_400,
    isFeatured: true,
    isLiked: false,
  },
  {
    id: "m2",
    title: "Next.js 15 Full-Stack Scaffold",
    description: "Generate production-ready Next.js apps with auth, DB, payments, and CI/CD. One prompt, full project.",
    author: "DevToolsmith",
    authorAvatar: "DT",
    category: "frontend",
    tags: ["nextjs", "typescript", "fullstack"],
    price: 14.99,
    rating: 4.8,
    sales: 218,
    likes: 634,
    views: 8_200,
    isFeatured: true,
    isLiked: true,
  },
  {
    id: "m3",
    title: "DeFi Arbitrage Strategy Designer",
    description: "Design profitable cross-DEX arbitrage strategies with slippage analysis, gas optimisation, and profit projections.",
    author: "DeFiQuant",
    authorAvatar: "DQ",
    category: "defi",
    tags: ["defi", "arbitrage", "solana", "uniswap"],
    price: 0,
    rating: 4.7,
    sales: 0,
    likes: 412,
    views: 5_600,
    isFeatured: false,
    isLiked: false,
  },
  {
    id: "m4",
    title: "Rust Performance Deep-Dive",
    description: "Identify cache-miss hotspots, unnecessary heap allocations, and async anti-patterns in Rust code.",
    author: "RustMaster",
    authorAvatar: "RM",
    category: "performance",
    tags: ["rust", "performance", "memory"],
    price: 7.99,
    rating: 4.6,
    sales: 156,
    likes: 289,
    views: 3_800,
    isFeatured: false,
    isLiked: false,
  },
  {
    id: "m5",
    title: "AI Product Manager",
    description: "Turn raw ideas into structured PRDs, user stories, and sprint plans. Include acceptance criteria and KPIs.",
    author: "PMCopilot",
    authorAvatar: "PM",
    category: "product",
    tags: ["product", "prd", "agile"],
    price: 0,
    rating: 4.5,
    sales: 0,
    likes: 178,
    views: 2_900,
    isFeatured: false,
    isLiked: false,
  },
  {
    id: "m6",
    title: "GraphQL API Architect",
    description: "Design type-safe GraphQL schemas, resolvers, and subscription patterns. Includes N+1 query detection.",
    author: "APIcraft",
    authorAvatar: "AC",
    category: "backend",
    tags: ["graphql", "api", "typescript"],
    price: 9.99,
    rating: 4.7,
    sales: 94,
    likes: 221,
    views: 3_100,
    isFeatured: false,
    isLiked: false,
  },
];

const CATEGORIES = ["All", "security", "frontend", "defi", "performance", "product", "backend"];

export default function MarketplacePage() {
  const [items, setItems] = useState(MARKETPLACE_ITEMS);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"featured" | "rating" | "sales" | "price">("featured");

  const handleLike = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
  };

  const handleBuy = (item: MarketplaceItem) => {
    if (item.price === 0) {
      toast.success("Prompt added to your library!");
    } else {
      toast.info(`Initiating checkout for $${item.price}…`);
    }
  };

  const filtered = items
    .filter((item) => {
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === "All" || item.category === activeCategory;
      const matchFree = !freeOnly || item.price === 0;
      return matchSearch && matchCat && matchFree;
    })
    .sort((a, b) => {
      if (sortBy === "featured") return Number(b.isFeatured) - Number(a.isFeatured);
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "sales") return b.sales - a.sales;
      if (sortBy === "price") return a.price - b.price;
      return 0;
    });

  const featured = items.filter((i) => i.isFeatured);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          Prompt Marketplace
        </h1>
        <p className="text-white/40 text-sm mt-0.5">
          Discover and purchase premium AI prompts from the community
        </p>
      </motion.div>

      {/* Featured */}
      {featured.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Star className="w-3 h-3 text-yellow-400" />
            Featured
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card glass className="border-primary/20 bg-primary/3">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="neon" className="text-[10px] mb-2">⭐ Featured</Badge>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </div>
                      {item.price === 0 ? (
                        <Badge variant="success">Free</Badge>
                      ) : (
                        <Badge variant="neon-purple">${item.price}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/60 mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-3 text-xs text-white/40 mb-4">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{item.rating}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-400" />{item.likes}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.views.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-400" />{item.sales} sales</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                          {item.authorAvatar}
                        </div>
                        <span className="text-xs text-white/50">{item.author}</span>
                      </div>
                      <Button variant="gradient" size="sm" onClick={() => handleBuy(item)}>
                        {item.price === 0 ? "Get Free" : `Buy $${item.price}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search marketplace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="featured" className="bg-gray-900">Featured</option>
            <option value="rating" className="bg-gray-900">Top Rated</option>
            <option value="sales" className="bg-gray-900">Best Selling</option>
            <option value="price" className="bg-gray-900">Price: Low→High</option>
          </select>
          <button
            onClick={() => setFreeOnly(!freeOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              freeOnly ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-white/40"
            }`}
          >
            <DollarSign className="w-3 h-3" />
            Free only
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              activeCategory === cat
                ? "bg-primary text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card glass className="h-full flex flex-col hover:border-primary/30 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[10px] capitalize">{item.category}</Badge>
                  {item.price === 0 ? (
                    <Badge variant="success" className="text-[10px]">Free</Badge>
                  ) : (
                    <span className="text-sm font-bold text-primary">${item.price}</span>
                  )}
                </div>
                <CardTitle className="text-sm leading-snug">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-xs text-white/50 mb-3 line-clamp-3 flex-1">{item.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 3).map((t) => (
                    <span key={t} className="flex items-center gap-0.5 text-[10px] text-white/30 bg-white/5 rounded px-1.5 py-0.5">
                      <Tag className="w-2 h-2" />{t}
                    </span>
                  ))}
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 text-[10px] text-white/30 mb-3">
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-400/70" />{item.rating}</span>
                  <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{item.views.toLocaleString()}</span>
                  {item.sales > 0 && (
                    <span className="flex items-center gap-0.5"><Sparkles className="w-3 h-3 text-green-400/70" />{item.sales} sold</span>
                  )}
                </div>

                {/* Author + Actions */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                      {item.authorAvatar}
                    </div>
                    <span className="text-[10px] text-white/40">{item.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleLike(item.id)}
                      className={`p-1 rounded transition-all ${item.isLiked ? "text-pink-400" : "text-white/30 hover:text-pink-400"}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${item.isLiked ? "fill-current" : ""}`} />
                    </button>
                    <Button variant={item.price === 0 ? "outline" : "gradient"} size="sm" className="h-7 text-[10px] px-2.5" onClick={() => handleBuy(item)}>
                      {item.price === 0 ? "Get Free" : `Buy`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No prompts found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
