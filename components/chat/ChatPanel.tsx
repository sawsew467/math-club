"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  User,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import ContentDisplay from "@/components/editor/ContentDisplay";
import CustomEditorDynamic from "@/components/editor/CustomEditorDynamic";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SubQuestion {
  label: string;
  content?: string;
  correct: boolean;
}

export interface QuestionContextType {
  questionNumber: number;
  question: string; // Raw HTML for display
  questionText: string; // Stripped text for AI
  type: "multiple-choice" | "true-false" | "fill-in" | "essay";
  options?: string[];
  correctAnswer: string | number;
  explanation: string; // Raw HTML for display
  explanationText: string; // Stripped text for AI
  userAnswer?: string | number;
  isCorrect?: boolean;
  points: number;
  subQuestions?: SubQuestion[]; // For true-false with multiple statements
  sampleAnswer?: string; // For essay questions
  aiFeedback?: string; // AI grading feedback for essay
  pointsEarned?: number; // Points earned from AI grading
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  questionContext: QuestionContextType;
}

export function ChatPanel({ open, onClose, questionContext }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Xin chào! Tôi là trợ lý AI. Bạn có thắc mắc gì về câu hỏi này không? Tôi sẽ giúp bạn hiểu rõ hơn về bài toán và gợi ý các nguồn tài liệu để học thêm. 📚",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Helper to strip HTML for AI processing
  const stripHtmlForAI = (html: string) => {
    if (!html) return "";
    if (typeof document !== "undefined") {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    }
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput || cleanInput === "<p></p>" || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const aiContext = {
        question: questionContext.questionText,
        correctAnswer: String(questionContext.correctAnswer),
        explanation: questionContext.explanationText,
        userAnswer: questionContext.userAnswer
          ? String(questionContext.userAnswer)
          : undefined,
      };

      const messagesForAI = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.role === "user" ? stripHtmlForAI(m.content) : m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesForAI,
          questionContext: aiContext,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      const assistantMsgId = Date.now().toString() + "-assistant";
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: assistantMessage } : m
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getCorrectAnswerDisplay = () => {
    if (questionContext.type === "multiple-choice" && questionContext.options) {
      const idx =
        typeof questionContext.correctAnswer === "number"
          ? questionContext.correctAnswer
          : parseInt(String(questionContext.correctAnswer));
      return (
        questionContext.options[idx] || String(questionContext.correctAnswer)
      );
    }
    if (questionContext.type === "true-false") {
      return questionContext.correctAnswer === 0 ? "Đúng" : "Sai";
    }
    return String(questionContext.correctAnswer);
  };

  const getUserAnswerDisplay = () => {
    if (questionContext.userAnswer === undefined) return "Chưa trả lời";
    if (questionContext.type === "multiple-choice" && questionContext.options) {
      const idx =
        typeof questionContext.userAnswer === "number"
          ? questionContext.userAnswer
          : parseInt(String(questionContext.userAnswer));
      return questionContext.options[idx] || String(questionContext.userAnswer);
    }
    if (questionContext.type === "true-false") {
      return questionContext.userAnswer === 0 ? "Đúng" : "Sai";
    }
    return String(questionContext.userAnswer);
  };

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center chat-panel-wrapper">
      {/* Backdrop */}
      <div
        className="chat-panel-backdrop absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="chat-panel-container relative w-full max-w-6xl h-[85vh] mx-4 bg-background rounded-lg shadow-xl flex flex-col animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Trợ lý AI - Câu {questionContext.questionNumber}
            </h2>
            <p className="text-sm text-muted-foreground">
              Hỏi bất kỳ điều gì về câu hỏi này để hiểu sâu hơn
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="flex items-center gap-1"
            >
              {showSidebar ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {showSidebar ? "Ẩn đề" : "Xem đề"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Sidebar - Question Details */}
          {showSidebar && (
            <div className="w-[400px] border-r flex flex-col bg-muted/30 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {/* Question */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                      Câu hỏi:
                    </h4>
                    <div className="bg-white p-3 rounded-lg border">
                      <ContentDisplay content={questionContext.question} />
                    </div>
                  </div>

                  {/* Options for multiple choice */}
                  {questionContext.type === "multiple-choice" &&
                    questionContext.options && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                          Các lựa chọn:
                        </h4>
                        <div className="space-y-2">
                          {questionContext.options.map((option, idx) => {
                            const isCorrect =
                              idx === questionContext.correctAnswer;
                            const isUserAnswer =
                              idx === questionContext.userAnswer;
                            return (
                              <div
                                key={idx}
                                className={`p-2 rounded-lg border text-sm ${
                                  isCorrect
                                    ? "bg-green-50 border-green-300"
                                    : isUserAnswer && !isCorrect
                                    ? "bg-red-50 border-red-300"
                                    : "bg-white"
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="font-medium">
                                    {String.fromCharCode(65 + idx)}.
                                  </span>
                                  <ContentDisplay
                                    content={option}
                                    className="flex-1"
                                  />
                                  {isCorrect && (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                  )}
                                  {isUserAnswer && !isCorrect && (
                                    <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* True-false with sub-questions */}
                  {questionContext.type === "true-false" &&
                    questionContext.subQuestions &&
                    questionContext.subQuestions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                          Các mệnh đề:
                        </h4>
                        <div className="space-y-2">
                          {(() => {
                            let userAnswerObj: Record<string, boolean> = {};
                            try {
                              if (questionContext.userAnswer) {
                                userAnswerObj = JSON.parse(
                                  String(questionContext.userAnswer)
                                );
                              }
                            } catch {
                              userAnswerObj = {};
                            }

                            return questionContext.subQuestions!.map((sub) => {
                              const userSubAnswer = userAnswerObj[sub.label];
                              const isSubCorrect = userSubAnswer === sub.correct;
                              const hasAnswered = userSubAnswer !== undefined;

                              return (
                                <div
                                  key={sub.label}
                                  className={`p-2 rounded-lg border text-sm ${
                                    isSubCorrect
                                      ? "bg-green-50 border-green-300"
                                      : hasAnswered
                                      ? "bg-red-50 border-red-300"
                                      : "bg-white"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <span className="font-medium">
                                        {sub.label})
                                      </span>{" "}
                                      {sub.content && (
                                        <ContentDisplay
                                          content={sub.content}
                                          className="inline"
                                        />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Badge
                                        variant="outline"
                                        className={
                                          sub.correct
                                            ? "bg-green-100 text-green-700 border-green-300"
                                            : "bg-red-100 text-red-700 border-red-300"
                                        }
                                      >
                                        {sub.correct ? "Đ" : "S"}
                                      </Badge>
                                      {isSubCorrect ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                  {/* Essay Question - Special Display */}
                  {questionContext.type === "essay" && (
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg border">
                        <h4 className="font-semibold text-xs text-muted-foreground mb-2">
                          Câu trả lời của bạn:
                        </h4>
                        <div className="text-sm">
                          {questionContext.userAnswer ? (
                            <ContentDisplay content={String(questionContext.userAnswer)} />
                          ) : (
                            <span className="text-gray-500">Chưa trả lời</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-xs text-green-700 mb-2">
                          Đáp án mẫu:
                        </h4>
                        <div className="text-sm">
                          {questionContext.sampleAnswer ? (
                            <ContentDisplay content={questionContext.sampleAnswer} />
                          ) : (
                            <span className="text-gray-500">(Chưa có đáp án mẫu)</span>
                          )}
                        </div>
                      </div>
                      {questionContext.aiFeedback && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-xs text-blue-700 mb-2 flex items-center gap-1">
                            <span>🤖</span> Nhận xét từ AI:
                          </h4>
                          <div className="text-sm text-blue-800">
                            <ContentDisplay content={questionContext.aiFeedback} />
                          </div>
                          {questionContext.pointsEarned !== undefined && (
                            <div className="mt-2 pt-2 border-t border-blue-200 text-sm font-semibold text-blue-900">
                              Điểm: {questionContext.pointsEarned.toFixed(1)}/{questionContext.points}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Answer Summary - Non-essay, non-true-false */}
                  {questionContext.type !== "essay" && !(
                    questionContext.type === "true-false" &&
                    questionContext.subQuestions &&
                    questionContext.subQuestions.length > 0
                  ) && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg border">
                        <h4 className="font-semibold text-xs text-muted-foreground mb-1">
                          Đáp án đúng:
                        </h4>
                        <div className="text-sm text-green-700">
                          {questionContext.type === "multiple-choice"
                            ? String.fromCharCode(
                                65 + Number(questionContext.correctAnswer)
                              )
                            : getCorrectAnswerDisplay()}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <h4 className="font-semibold text-xs text-muted-foreground mb-1">
                          Câu trả lời của bạn:
                        </h4>
                        <div
                          className={`text-sm ${
                            questionContext.isCorrect
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {questionContext.userAnswer !== undefined
                            ? questionContext.type === "multiple-choice"
                              ? String.fromCharCode(
                                  65 + Number(questionContext.userAnswer)
                                )
                              : getUserAnswerDisplay()
                            : "Chưa trả lời"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Result Badge */}
                  <div className="flex items-center gap-2">
                    {questionContext.type === "essay" ? (
                      questionContext.aiFeedback ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          🤖 AI đã chấm: {questionContext.pointsEarned?.toFixed(1) || 0}/{questionContext.points} điểm
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Cần chấm điểm ({questionContext.points} điểm)
                        </Badge>
                      )
                    ) : questionContext.isCorrect ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Đúng (+
                        {questionContext.points} điểm)
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        <XCircle className="mr-1 h-3 w-3" /> Sai
                      </Badge>
                    )}
                  </div>

                  {/* Explanation - only for non-essay questions */}
                  {questionContext.type !== "essay" && questionContext.explanation && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                        Giải thích:
                      </h4>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <ContentDisplay content={questionContext.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 min-h-0 px-6">
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeRaw, rehypeKatex]}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-sm [&_.ck-content]:p-0! [&_.ck-content]:border-0! [&_img]:max-w-full [&_img]:rounded">
                          <ContentDisplay content={message.content} />
                        </div>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="px-6 py-4 border-t bg-background">
              <div className="flex gap-2 items-end">
                <div className="flex-1 border rounded-lg overflow-hidden">
                  <CustomEditorDynamic
                    value={input}
                    onChange={(value) => setInput(value)}
                    placeholder="Hỏi về câu hỏi này... (hỗ trợ công thức toán và hình ảnh)"
                    minHeight="60px"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !input.trim() || input === "<p></p>"}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
