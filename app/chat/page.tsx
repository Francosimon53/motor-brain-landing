"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase-browser";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export default function ChatPage() {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfText, setPdfText] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [pdfChars, setPdfChars] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (data) setConversations(data);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectConversation(conv: Conversation) {
    setActiveConvId(conv.id);
    setMessages(conv.messages || []);
    setSidebarOpen(false);
  }

  function newChat() {
    setActiveConvId(null);
    setMessages([]);
    setInput("");
    setPdfText("");
    setPdfName("");
    setPdfChars(0);
    setPdfError("");
    setSidebarOpen(false);
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    setPdfError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setPdfError(data.error || "Failed to parse PDF");
      } else if (!data.text || data.text.trim().length === 0) {
        setPdfError("PDF has no extractable text. Try a different file.");
      } else {
        setPdfText(data.text);
        setPdfName(file.name);
        setPdfChars(data.chars || data.text.length);

        if (userId) {
          await supabase.from("documents").insert({
            user_id: userId,
            filename: file.name,
            char_count: data.chars || data.text.length,
          });
        }
      }
    } catch {
      setPdfError("Failed to upload PDF. Please try again.");
    }
    setPdfLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensajes: newMessages,
          ...(pdfText ? { contexto_pdf: pdfText } : {}),
        }),
      });

      const data = await res.json();
      const content =
        data.respuesta ||
        data.response ||
        data.answer ||
        data.content ||
        data.message ||
        (typeof data === "string" ? data : JSON.stringify(data));

      const assistantMessage: Message = { role: "assistant", content };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // Save to Supabase
      if (activeConvId) {
        await supabase
          .from("conversations")
          .update({
            messages: updatedMessages,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeConvId);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  messages: updatedMessages,
                  updated_at: new Date().toISOString(),
                }
              : c
          )
        );
      } else {
        const title =
          input.slice(0, 50) + (input.length > 50 ? "..." : "");
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            user_id: userId,
            title,
            messages: updatedMessages,
          })
          .select()
          .single();

        if (newConv) {
          setActiveConvId(newConv.id);
          setConversations((prev) => [newConv, ...prev]);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error connecting to the AI. Please try again.",
        },
      ]);
    }

    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  /* ── Sidebar content ── */
  const conversationSidebar = (
    <div className="flex h-full flex-col">
      {/* Brand + back */}
      <div className="flex items-center justify-between px-4 pb-4">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            Motor Brain
          </span>
        </Link>
      </div>

      {/* New chat */}
      <div className="px-3 pb-3">
        <button
          onClick={newChat}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => selectConversation(conv)}
            className={`w-full truncate rounded-lg px-3 py-2.5 text-left text-sm transition ${
              activeConvId === conv.id
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {conv.title || "Untitled"}
          </button>
        ))}
        {conversations.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-gray-600">
            No conversations yet
          </p>
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-white/5 px-3 pt-3 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 py-5 md:flex">
        {conversationSidebar}
      </aside>

      {/* Mobile header */}
      <div className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/5 bg-gray-950/90 px-4 py-3 backdrop-blur-md md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 text-sm text-gray-400"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          Chats
        </button>
        <span className="text-sm font-bold">
          <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            Motor Brain
          </span>
        </span>
        <div className="w-12" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-white/5 bg-gray-950 py-5 md:hidden">
            {conversationSidebar}
          </aside>
        </>
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col pt-14 md:pt-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-300">
                  Motor Brain Chat
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Ask clinical questions or upload a PDF to get started.
                </p>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-600/20 text-gray-100"
                      : "bg-white/[0.04] text-gray-300 border border-white/5"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.04] px-5 py-3.5 text-sm text-gray-400">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* PDF badge */}
        {pdfName && (
          <div className="border-t border-white/5 px-4 py-2 md:px-8">
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                <span>📄</span>
                {pdfName} ({pdfChars.toLocaleString()} chars)
              </span>
              <button
                onClick={() => {
                  setPdfText("");
                  setPdfName("");
                  setPdfChars(0);
                  setPdfError("");
                }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
                title="Remove PDF"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* PDF error */}
        {pdfError && (
          <div className="border-t border-white/5 px-4 py-2 md:px-8">
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
                {pdfError}
              </span>
              <button
                onClick={() => setPdfError("")}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-white/5 px-4 py-4 md:px-8">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            {/* PDF upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handlePdfUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={pdfLoading}
              className="shrink-0 rounded-lg border border-white/10 p-2.5 text-gray-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
              title="Upload PDF"
            >
              {pdfLoading ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              )}
            </button>

            {/* Text input */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a clinical question..."
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
            />

            {/* Send */}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-emerald-600 p-2.5 text-white transition hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
