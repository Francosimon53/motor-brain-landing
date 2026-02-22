"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase-browser";

/* ── Types ── */

interface Clasificacion {
  dominio: string;
  confianza: number;
  conceptos_clave: string[];
}

interface FileInfo {
  name: string;
  size: number;
}

interface SectionProgress {
  name: string;
  status: "pending" | "writing" | "complete";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  clasificacion?: Clasificacion | null;
  type?: "text" | "file-upload" | "progress" | "complete";
  files?: FileInfo[];
  assessmentId?: string;
  sections?: SectionProgress[];
  pageCount?: number;
  wordCount?: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface AssessmentIntent {
  assessmentType: string;
  insurer: string;
  hours?: number;
}

/* ── Constants ── */

const ACCEPTED_TYPES = ".pdf,.docx,.doc,.png,.jpg,.jpeg";

const ASSESSMENT_SECTIONS = [
  "Cover Sheet",
  "Reason for Referral",
  "Background Information",
  "Medical History",
  "Developmental History",
  "Educational History",
  "Family Structure",
  "Assessment Measures",
  "Behavioral Observations",
  "Skill Assessment Results",
  "Behavior Assessment Results",
  "Treatment Recommendations",
  "Goals and Objectives",
  "Medical Necessity",
  "Service Authorization Request",
  "Treatment Plan",
  "Signatures Page",
];

const ASSESSMENT_TYPE_MAP: Record<string, string> = {
  "initial assessment": "initial",
  "initial eval": "initial",
  "initial evaluation": "initial",
  reassessment: "reassessment",
  "re-assessment": "reassessment",
  "progress report": "progress",
  "progress update": "progress",
  "discharge summary": "discharge",
  discharge: "discharge",
};

const INSURER_MAP: Record<string, string> = {
  aetna: "aetna",
  cigna: "cigna",
  bcbs: "bcbs",
  "blue cross": "bcbs",
  "blue shield": "bcbs",
  united: "united",
  unitedhealth: "united",
  humana: "humana",
  medicaid: "medicaid",
  tricare: "tricare",
  anthem: "anthem",
  caresource: "caresource",
  molina: "molina",
  amerihealth: "amerihealth",
};

/* ── Helpers ── */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function parseAssessmentIntent(text: string): AssessmentIntent | null {
  const lower = text.toLowerCase();

  let assessmentType: string | undefined;
  for (const [keyword, type] of Object.entries(ASSESSMENT_TYPE_MAP)) {
    if (lower.includes(keyword)) {
      assessmentType = type;
      break;
    }
  }

  let insurer: string | undefined;
  for (const [keyword, id] of Object.entries(INSURER_MAP)) {
    if (lower.includes(keyword)) {
      insurer = id;
      break;
    }
  }

  if (!assessmentType || !insurer) return null;

  const hoursMatch = lower.match(/(\d+)\s*hours?/);
  return {
    assessmentType,
    insurer,
    hours: hoursMatch ? parseInt(hoursMatch[1]) : undefined,
  };
}

/* ── Component ── */

export default function ChatPage() {
  const supabase = createClient();
  const router = useRouter();

  // Existing state
  const [userId, setUserId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Legacy PDF state (for backward compat with existing chat flow)
  const [pdfText, setPdfText] = useState("");

  // Assessment engine state
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFilesRef = useRef<File[]>([]);
  const dragCounterRef = useRef(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  /* ── Effects ── */

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

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
    };
  }, []);

  /* ── Conversation management ── */

  function selectConversation(conv: Conversation) {
    setActiveConvId(conv.id);
    setMessages(conv.messages || []);
    setAssessmentId(null);
    setPdfText("");
    pendingFilesRef.current = [];
    setSidebarOpen(false);
  }

  function newChat() {
    setActiveConvId(null);
    setMessages([]);
    setInput("");
    setPdfText("");
    setAssessmentId(null);
    pendingFilesRef.current = [];
    setSidebarOpen(false);
  }

  /* ── Drag & drop ── */

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFilesSelected(files);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, userId]
  );

  /* ── File upload ── */

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFilesSelected(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFilesSelected(files: File[]) {
    if (fileUploading || loading) return;

    pendingFilesRef.current = [...pendingFilesRef.current, ...files];

    // Add file upload message
    const fileInfos: FileInfo[] = files.map((f) => ({
      name: f.name,
      size: f.size,
    }));

    const fileMessage: Message = {
      role: "user",
      content: files.map((f) => `${f.name} (${formatSize(f.size)})`).join(", "),
      type: "file-upload",
      files: fileInfos,
    };

    const newMessages = [...messages, fileMessage];
    setMessages(newMessages);
    setFileUploading(true);

    try {
      // Parse files via the assessment parse endpoint
      // Backend expects field name "files" (plural, array)
      const summaries: string[] = [];
      let combinedText = "";

      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const res = await fetch("/api/assessment/parse", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Parse response:", data);

        // Handle both array and single document responses
        if (Array.isArray(data.documents)) {
          for (const doc of data.documents) {
            const name = doc.filename || doc.name || "Document";
            const summary =
              doc.summary || doc.text?.slice(0, 300) || `Parsed ${name}`;
            summaries.push(
              `**${name}**: ${summary}${doc.text?.length > 300 ? "..." : ""}`
            );
            if (doc.text) combinedText += doc.text + "\n\n";
          }
        } else {
          // Single document or flat response
          const summary =
            data.summary || data.text?.slice(0, 300) || "Documents parsed successfully";
          summaries.push(summary + (data.text?.length > 300 ? "..." : ""));
          if (data.text) combinedText += data.text + "\n\n";
        }
      } else {
        console.error("Backend parse failed, trying local fallback");
        // Fallback: parse PDFs locally one by one
        for (const file of files) {
          if (file.name.toLowerCase().endsWith(".pdf")) {
            const localFd = new FormData();
            localFd.append("file", file);
            const localRes = await fetch("/api/parse-pdf", {
              method: "POST",
              body: localFd,
            });
            if (localRes.ok) {
              const localData = await localRes.json();
              summaries.push(
                `**${file.name}**: Extracted ${localData.chars?.toLocaleString() || 0} characters from ${localData.pages || 0} pages`
              );
              if (localData.text) combinedText += localData.text + "\n\n";
            } else {
              summaries.push(`**${file.name}**: Failed to parse`);
            }
          } else {
            summaries.push(`**${file.name}**: Failed to parse`);
          }
        }
      }

      // Store combined text for chat context
      if (combinedText) setPdfText((prev) => (prev ? prev + "\n\n" : "") + combinedText);

      // Save documents to Supabase
      if (userId) {
        for (const file of files) {
          await supabase.from("documents").insert({
            user_id: userId,
            filename: file.name,
            char_count: combinedText.length,
          });
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content:
          `I've analyzed your documents:\n\n${summaries.join("\n\n")}\n\n` +
          `Tell me the assessment type, insurer, and hours to request (e.g., "Initial assessment, Aetna, 25 hours") and I'll generate the complete assessment.`,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveConversation(updatedMessages);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I had trouble parsing those files. Please try again or upload a different format.",
        },
      ]);
    }

    setFileUploading(false);
  }

  /* ── Conversation persistence ── */

  async function saveConversation(updatedMessages: Message[]) {
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
      const firstUserMsg = updatedMessages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 50) +
          (firstUserMsg.content.length > 50 ? "..." : "")
        : "New assessment";

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
  }

  /* ── Assessment generation ── */

  async function createAndGenerateAssessment(intent: AssessmentIntent) {
    // Show progress message
    const initialSections: SectionProgress[] = ASSESSMENT_SECTIONS.map(
      (name, i) => ({
        name,
        status: i === 0 ? ("writing" as const) : ("pending" as const),
      })
    );

    const progressMsg: Message = {
      role: "assistant",
      content: `Generating your ${intent.assessmentType} assessment...`,
      type: "progress",
      sections: initialSections,
    };

    setMessages((prev) => [...prev, progressMsg]);

    // Start progress simulation
    let currentSection = 0;
    progressIntervalRef.current = setInterval(() => {
      currentSection++;
      if (currentSection >= ASSESSMENT_SECTIONS.length) {
        if (progressIntervalRef.current)
          clearInterval(progressIntervalRef.current);
        return;
      }

      setMessages((prev) => {
        const copy = [...prev];
        const lastMsg = copy[copy.length - 1];
        if (lastMsg?.type === "progress" && lastMsg.sections) {
          const newMsg = { ...lastMsg };
          newMsg.sections = lastMsg.sections.map((s, idx) => {
            if (idx < currentSection)
              return { ...s, status: "complete" as const };
            if (idx === currentSection)
              return { ...s, status: "writing" as const };
            return s;
          });
          copy[copy.length - 1] = newMsg;
        }
        return copy;
      });
    }, 1200);

    try {
      // 1. Create assessment
      const createRes = await fetch("/api/assessment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_type: intent.assessmentType,
          insurer_id: intent.insurer,
        }),
      });

      const createData = await createRes.json();
      console.log("Assessment create response:", createData);

      const newAssessmentId =
        createData.assessment_id || createData.id;
      if (!newAssessmentId) {
        throw new Error(
          `Backend did not return an assessment ID. Response: ${JSON.stringify(createData)}`
        );
      }
      setAssessmentId(newAssessmentId);

      // 2. Upload pending files (backend expects field "files", plural)
      const uploadFormData = new FormData();
      for (const file of pendingFilesRef.current) {
        uploadFormData.append("files", file);
      }
      const uploadRes = await fetch(
        `/api/assessment/${newAssessmentId}/upload`,
        { method: "POST", body: uploadFormData }
      );
      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        console.error("Upload failed:", uploadErr);
        throw new Error(
          uploadErr.detail || uploadErr.error || "File upload failed"
        );
      }
      console.log("Upload response:", await uploadRes.clone().json());

      // 3. Generate all sections (no request body needed)
      const genRes = await fetch(
        `/api/assessment/${newAssessmentId}/generate`,
        { method: "POST" }
      );

      const genData = await genRes.json();
      console.log("Generate response:", genData);

      if (!genRes.ok) {
        throw new Error(
          genData.detail || genData.error || "Assessment generation failed"
        );
      }

      // Stop progress simulation
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);

      // Show completion message with real data
      const pageCount = genData.total_pages || genData.pages || genData.page_count;
      const wordCount = genData.total_words || genData.words || genData.word_count;

      const completionParts = ["Assessment complete"];
      if (pageCount) completionParts.push(`${pageCount} pages`);
      if (wordCount)
        completionParts.push(`~${wordCount.toLocaleString()} words`);

      const completeMsg: Message = {
        role: "assistant",
        content:
          completionParts.length > 1
            ? `${completionParts[0]} — ${completionParts.slice(1).join(", ")}`
            : completionParts[0],
        type: "complete",
        assessmentId: newAssessmentId,
        sections: ASSESSMENT_SECTIONS.map((name) => ({
          name,
          status: "complete" as const,
        })),
        ...(pageCount ? { pageCount } : {}),
        ...(wordCount ? { wordCount } : {}),
      };

      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = completeMsg;
        return copy;
      });

      // Save conversation
      setMessages((prev) => {
        saveConversation(prev);
        return prev;
      });
    } catch (err) {
      console.error("Assessment generation error:", err);
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);

      const errMsg =
        err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `Failed to generate assessment: ${errMsg}`,
        };
        return copy;
      });
    }
  }

  /* ── Send message ── */

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const currentInput = input;
    setInput("");
    setLoading(true);

    // Check if this is an assessment request
    const intent = parseAssessmentIntent(currentInput);
    if (intent && pendingFilesRef.current.length > 0) {
      await createAndGenerateAssessment(intent);
      setLoading(false);
      return;
    }

    // Check if we have an active assessment and this is a modification request
    if (assessmentId) {
      try {
        const res = await fetch(`/api/assessment/${assessmentId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: currentInput }),
        });

        const data = await res.json();
        const content =
          data.respuesta ||
          data.response ||
          data.message ||
          data.content ||
          (typeof data === "string" ? data : JSON.stringify(data));

        const assistantMessage: Message = {
          role: "assistant",
          content,
          type: "complete",
          assessmentId,
        };

        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        await saveConversation(updatedMessages);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Error processing your request. Please try again.",
          },
        ]);
      }
      setLoading(false);
      return;
    }

    // Regular chat flow (existing behavior)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensajes: newMessages.filter((m) => !m.type || m.type === "text"),
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

      const assistantMessage: Message = {
        role: "assistant",
        content,
        clasificacion: data.clasificacion || null,
      };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveConversation(updatedMessages);
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

  /* ── Download handler ── */

  async function handleDownload(format: "word" | "pdf" | "docx", aId?: string) {
    const targetId = aId || assessmentId;
    if (!targetId) return;

    try {
      // Backend expects "pdf" or "docx", not "word"
      const backendFormat = format === "word" ? "docx" : format;

      const res = await fetch(`/api/assessment/${targetId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: backendFormat }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || `Export failed (${res.status})`
        );
      }

      const contentType = res.headers.get("content-type") || "";

      // If the proxy returned JSON (e.g., with a direct download URL)
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const fileUrl =
          data.file_path || data.url || data.download_url || data.file_url;

        if (fileUrl) {
          // Download from the direct URL
          const fileRes = await fetch(fileUrl);
          if (!fileRes.ok) throw new Error("Failed to fetch file");

          const blob = await fileRes.blob();
          const ext = backendFormat === "docx" ? "docx" : "pdf";
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `assessment.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        }

        throw new Error(data.error || "No download URL in response");
      }

      // Proxy returned the file directly as a blob
      const blob = await res.blob();
      const ext = format === "word" ? "docx" : "pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Failed to download ${format.toUpperCase()} file. ${err instanceof Error ? err.message : "Please try again."}`,
        },
      ]);
    }
  }

  /* ── Input handlers ── */

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

  /* ── Message renderers ── */

  function renderFileUploadMessage(msg: Message) {
    return (
      <div className="space-y-2">
        {msg.files?.map((file, j) => (
          <div
            key={j}
            className="inline-flex items-center gap-2.5 rounded-xl border border-teal-500/20 bg-white/[0.04] px-4 py-2.5"
          >
            <svg
              className="h-5 w-5 shrink-0 text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-200">
              {file.name}
            </span>
            <span className="text-xs text-gray-500">
              ({formatSize(file.size)})
            </span>
          </div>
        ))}
      </div>
    );
  }

  function renderProgressMessage(msg: Message) {
    const completed =
      msg.sections?.filter((s) => s.status === "complete").length || 0;
    const total = msg.sections?.length || ASSESSMENT_SECTIONS.length;

    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-200">{msg.content}</p>
        <div className="space-y-1.5 font-mono text-xs">
          {msg.sections?.map((section, j) => (
            <div key={j} className="flex items-center gap-2">
              {section.status === "complete" && (
                <span className="text-teal-400">&#10003;</span>
              )}
              {section.status === "writing" && (
                <span className="animate-pulse text-amber-400">&#9889;</span>
              )}
              {section.status === "pending" && (
                <span className="text-gray-600">&#9675;</span>
              )}
              <span
                className={
                  section.status === "complete"
                    ? "text-gray-300"
                    : section.status === "writing"
                      ? "text-amber-300"
                      : "text-gray-600"
                }
              >
                {section.name}
                {section.status === "writing" && " (writing...)"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Progress: {completed}/{total} sections
        </p>
      </div>
    );
  }

  function renderCompleteMessage(msg: Message) {
    const targetId = msg.assessmentId || assessmentId;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-teal-400">&#10003;</span>
          <p className="text-sm font-medium text-gray-200">
            Assessment complete
            {msg.pageCount ? ` — ${msg.pageCount} pages` : ""}
            {msg.wordCount
              ? `, ~${msg.wordCount.toLocaleString()} words`
              : ""}
          </p>
        </div>

        {msg.content && !msg.content.startsWith("Assessment complete") && (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}

        {targetId && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDownload("docx", targetId)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 px-3 py-1.5 text-xs font-medium text-teal-400 transition hover:border-teal-500/50 hover:bg-teal-500/10"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Download Word
            </button>
            <button
              onClick={() => handleDownload("pdf", targetId)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 px-3 py-1.5 text-xs font-medium text-teal-400 transition hover:border-teal-500/50 hover:bg-teal-500/10"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Download PDF
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Sidebar content ── */
  const conversationSidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-4">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            Motor Brain
          </span>
        </Link>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={newChat}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New chat
        </button>
      </div>

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

      <div className="border-t border-white/5 px-3 pt-3 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );

  /* ── Render ── */

  return (
    <div
      className="flex h-screen bg-gray-950 text-gray-100"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center border-2 border-dashed border-teal-500/60 bg-teal-500/5">
          <div className="text-center">
            <svg
              className="mx-auto mb-3 h-12 w-12 text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-lg font-medium text-teal-400">
              Drop clinical documents here
            </p>
            <p className="mt-1 text-sm text-gray-400">PDF, DOCX, PNG, JPG</p>
          </div>
        </div>
      )}

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
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
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
          {/* Smart onboarding / empty state */}
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md text-center">
                <h2 className="text-xl font-bold text-gray-200">
                  Motor Brain Assessment Engine
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  I generate complete ABA assessments for insurance
                  authorization.
                </p>

                <div className="mt-6 space-y-3 text-left">
                  <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                    <span className="mt-0.5 shrink-0 text-teal-400">1.</span>
                    <p className="text-sm text-gray-300">
                      Drop your clinical documents here (VB-MAPP, referrals,
                      observation notes)
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                    <span className="mt-0.5 shrink-0 text-teal-400">2.</span>
                    <p className="text-sm text-gray-300">
                      Tell me the client&apos;s insurer and hours you want to
                      request
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                    <span className="mt-0.5 shrink-0 text-teal-400">3.</span>
                    <p className="text-sm text-gray-300">
                      I&apos;ll generate the complete assessment in your format
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-xs text-gray-500">
                  Tip: Upload a previously approved assessment first so I can
                  learn your format.
                </p>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-teal-500/30 px-5 py-2.5 text-sm font-medium text-teal-400 transition hover:border-teal-500/50 hover:bg-teal-500/10"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                    />
                  </svg>
                  Upload Documents
                </button>

                <p className="mt-4 text-xs text-gray-600">
                  Or ask a clinical question to chat directly.
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
                <div className="max-w-[85%]">
                  {/* Classifier badge for assistant messages */}
                  {msg.role === "assistant" && msg.clasificacion && (
                    <div className="mb-2 space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                        <span>&#129504;</span>
                        Domain {msg.clasificacion.dominio} (
                        {(msg.clasificacion.confianza * 100).toFixed(1)}%)
                      </span>
                      {msg.clasificacion.conceptos_clave.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {msg.clasificacion.conceptos_clave.map((c, j) => (
                            <span
                              key={j}
                              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-gray-400"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message content by type */}
                  {msg.type === "file-upload" ? (
                    <div className="rounded-2xl bg-violet-600/20 px-5 py-3.5 text-sm">
                      {renderFileUploadMessage(msg)}
                    </div>
                  ) : msg.type === "progress" ? (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.04] px-5 py-3.5 text-sm">
                      {renderProgressMessage(msg)}
                    </div>
                  ) : msg.type === "complete" ? (
                    <div className="rounded-2xl border border-teal-500/10 bg-white/[0.04] px-5 py-3.5 text-sm">
                      {renderCompleteMessage(msg)}
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
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
                  )}
                </div>
              </div>
            ))}

            {/* Loading / typing indicator */}
            {(loading || fileUploading) && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.04] px-5 py-3.5 text-sm text-gray-400">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {fileUploading ? "Parsing documents..." : "Analyzing..."}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-white/5 px-4 py-4 md:px-8">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={fileUploading || loading}
              className="shrink-0 rounded-lg border border-white/10 p-2.5 text-gray-400 transition hover:border-teal-500/30 hover:text-teal-400 disabled:opacity-50"
              title="Upload documents"
            >
              {fileUploading ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                  />
                </svg>
              )}
            </button>

            {/* Text input */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                pendingFilesRef.current.length > 0
                  ? 'e.g., "Initial assessment, Aetna, 25 hours"'
                  : "Ask a clinical question or describe your assessment..."
              }
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
            />

            {/* Send */}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-emerald-600 p-2.5 text-white transition hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
