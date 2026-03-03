"use client";

import React, { useState, use } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FolderOpen,
  Play,
  Square,
  ChevronRight,
  ChevronDown,
  X,
  Plus,
  Terminal,
  Settings,
  Save,
  RefreshCw,
} from "lucide-react";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  language?: string;
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

const MOCK_FILES: FileNode[] = [
  {
    id: "src",
    name: "src",
    type: "folder",
    isOpen: true,
    children: [
      {
        id: "index",
        name: "index.ts",
        type: "file",
        language: "typescript",
        content: `import express from 'express';
import { createServer } from './server';
import { connectDatabase } from './db';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await connectDatabase();
    const app = createServer();
    
    app.listen(PORT, () => {
      logger.info(\`Server running on port \${PORT}\`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();`,
      },
      {
        id: "server",
        name: "server.ts",
        type: "file",
        language: "typescript",
        content: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { apiRouter } from './routes/api';
import { errorHandler } from './middleware/error';

export function createServer() {
  const app = express();
  
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  
  app.use('/auth', authRouter);
  app.use('/api', apiRouter);
  app.use(errorHandler);
  
  return app;
}`,
      },
      {
        id: "routes",
        name: "routes",
        type: "folder",
        isOpen: false,
        children: [
          {
            id: "auth-route",
            name: "auth.ts",
            type: "file",
            language: "typescript",
            content: `import { Router } from 'express';
import { login, register, logout } from '../controllers/auth';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/register', register);
authRouter.post('/logout', logout);`,
          },
        ],
      },
    ],
  },
  {
    id: "package-json",
    name: "package.json",
    type: "file",
    language: "json",
    content: `{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5"
  }
}`,
  },
  {
    id: "readme",
    name: "README.md",
    type: "file",
    language: "markdown",
    content: `# My AIOS Project

Generated and maintained by AIOS agents.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
  },
];

interface OpenTab {
  id: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
}

function FileTreeItem({
  node,
  depth,
  onSelect,
  selectedId,
  onToggle,
}: {
  node: FileNode;
  depth: number;
  onSelect: (node: FileNode) => void;
  selectedId?: string;
  onToggle: (id: string) => void;
}) {
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer group transition-colors text-xs",
          isSelected
            ? "bg-primary/10 text-primary"
            : "text-white/50 hover:text-white/80 hover:bg-white/4"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => {
          if (node.type === "folder") onToggle(node.id);
          else onSelect(node);
        }}
      >
        {node.type === "folder" ? (
          <>
            {node.isOpen ? (
              <ChevronDown className="w-3 h-3 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
            )}
            <FolderOpen className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
          </>
        ) : (
          <>
            <span className="w-3 flex-shrink-0" />
            <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {node.type === "folder" && node.isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const TERMINAL_OUTPUT = [
  { type: "info", text: "$ npm run dev" },
  { type: "success", text: "✓ TypeScript compilation successful" },
  { type: "info", text: "Server running on port 3000" },
  { type: "info", text: "Database connected: PostgreSQL 15.0" },
  { type: "success", text: "✓ All 3 agents initialized" },
  { type: "warning", text: "⚠ Rate limit approaching: 85% of hourly quota used" },
];

export default function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [files, setFiles] = useState(MOCK_FILES);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([
    {
      id: "index",
      name: "index.ts",
      content: MOCK_FILES[0].children![0].content!,
      language: "typescript",
      isDirty: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState("index");
  const [selectedFileId, setSelectedFileId] = useState("index");
  const [showTerminal, setShowTerminal] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  const openFile = (node: FileNode) => {
    if (node.type !== "file") return;
    setSelectedFileId(node.id);
    if (!openTabs.find((t) => t.id === node.id)) {
      setOpenTabs([
        ...openTabs,
        {
          id: node.id,
          name: node.name,
          content: node.content || "",
          language: node.language || "typescript",
          isDirty: false,
        },
      ]);
    }
    setActiveTabId(node.id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t.id !== id);
    setOpenTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const updateContent = (content: string) => {
    setOpenTabs(
      openTabs.map((t) =>
        t.id === activeTabId ? { ...t, content, isDirty: true } : t
      )
    );
  };

  const saveFile = () => {
    setOpenTabs(openTabs.map((t) => (t.id === activeTabId ? { ...t, isDirty: false } : t)));
  };

  const toggleFolder = (id: string) => {
    const toggle = (nodes: FileNode[]): FileNode[] =>
      nodes.map((n) =>
        n.id === id
          ? { ...n, isOpen: !n.isOpen }
          : { ...n, children: n.children ? toggle(n.children) : undefined }
      );
    setFiles(toggle(files));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 overflow-hidden">
      {/* File Explorer */}
      <div className="w-52 border-r border-white/5 flex flex-col bg-[#080810]/50 flex-shrink-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Explorer
          </span>
          <button className="text-white/30 hover:text-white/60">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {files.map((node) => (
            <FileTreeItem
              key={node.id}
              node={node}
              depth={0}
              onSelect={openFile}
              selectedId={selectedFileId}
              onToggle={toggleFolder}
            />
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Bar */}
        <div className="flex items-center border-b border-white/5 bg-[#0a0a14]/80 overflow-x-auto flex-shrink-0">
          {openTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs cursor-pointer border-r border-white/5 whitespace-nowrap group transition-colors",
                activeTabId === tab.id
                  ? "bg-[#0d0d18] text-white/90 border-b-2 border-b-primary"
                  : "text-white/40 hover:text-white/70 hover:bg-white/3"
              )}
            >
              <FileText className="w-3 h-3" />
              {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
              {tab.name}
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1 px-3">
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 text-white/30"
              onClick={saveFile}
              title="Save (Ctrl+S)"
            >
              <Save className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Editor + Terminal */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Code Editor */}
          <div className={cn("flex-1 min-h-0", showTerminal ? "" : "")}>
            {activeTab ? (
              <CodeEditor
                value={activeTab.content}
                onChange={updateContent}
                language={activeTab.language as "typescript" | "javascript" | "python" | "json" | "markdown"}
                height="100%"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-white/20 text-sm">
                Select a file to edit
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-48 border-t border-white/5 bg-[#050508] flex flex-col flex-shrink-0">
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs text-white/40 font-medium">Terminal</span>
                  <Badge
                    variant={isRunning ? "neon" : "outline"}
                    className="text-[10px] py-0"
                  >
                    {isRunning ? "Running" : "Stopped"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={cn(
                      "p-1 rounded transition-colors text-white/30 hover:text-white/70"
                    )}
                  >
                    {isRunning ? (
                      <Square className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowTerminal(false)}
                    className="p-1 rounded text-white/30 hover:text-white/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs space-y-1">
                {TERMINAL_OUTPUT.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      line.type === "success" ? "text-green-400" :
                      line.type === "warning" ? "text-yellow-400" :
                      line.type === "error" ? "text-red-400" :
                      "text-white/60"
                    )}
                  >
                    {line.text}
                  </div>
                ))}
                <div className="flex items-center gap-1 text-primary">
                  <span>$</span>
                  <span className="w-1.5 h-3.5 bg-primary animate-pulse ml-0.5" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Panel */}
      <div className="w-80 flex-shrink-0">
        <ChatPanel projectId={id} className="h-full" />
      </div>
    </div>
  );
}
