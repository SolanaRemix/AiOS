"use client";

import React, { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { cn } from "@/lib/utils";

type Language =
  | "javascript"
  | "typescript"
  | "python"
  | "css"
  | "html"
  | "json"
  | "markdown"
  | "text";

function getLanguageExtension(lang: Language) {
  switch (lang) {
    case "javascript":
      return javascript();
    case "typescript":
      return javascript({ typescript: true });
    case "python":
      return python();
    case "css":
      return css();
    case "html":
      return html();
    case "json":
      return json();
    case "markdown":
      return markdown();
    default:
      return javascript();
  }
}

const customTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent !important",
    height: "100%",
    fontSize: "13px",
  },
  ".cm-scroller": {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineHeight: "1.6",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "16px 0",
    caretColor: "#00f5ff",
  },
  ".cm-cursor": {
    borderLeftColor: "#00f5ff",
    borderLeftWidth: "2px",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(0, 245, 255, 0.04)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(0, 245, 255, 0.04)",
  },
  ".cm-gutters": {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.2)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 16px",
    minWidth: "40px",
  },
  ".cm-selectionBackground, .cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(0, 245, 255, 0.15) !important",
  },
  ".cm-matchingBracket": {
    backgroundColor: "rgba(0, 245, 255, 0.2)",
    outline: "none",
    borderBottom: "1px solid rgba(0, 245, 255, 0.5)",
  },
  ".cm-tooltip": {
    backgroundColor: "rgba(10, 10, 20, 0.95)",
    border: "1px solid rgba(0, 245, 255, 0.2)",
    borderRadius: "8px",
  },
});

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: Language;
  readOnly?: boolean;
  className?: string;
  height?: string;
  placeholder?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "typescript",
  readOnly = false,
  className,
  height = "100%",
  placeholder,
}: CodeEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onChange?.(val);
    },
    [onChange]
  );

  return (
    <div
      className={cn(
        "h-full w-full overflow-hidden bg-[#0d0d18] rounded-none",
        className
      )}
      style={{ height }}
    >
      <CodeMirror
        value={value}
        onChange={handleChange}
        extensions={[
          getLanguageExtension(language),
          customTheme,
          EditorView.lineWrapping,
        ]}
        theme={oneDark}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        placeholder={placeholder}
        height={height}
        style={{ height }}
      />
    </div>
  );
}
