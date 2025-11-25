"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import ContentDisplay from "@/components/editor/ContentDisplay";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
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
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionContext: QuestionContextType;
}

export function ChatDialog({
  open,
  onOpenChange,
  questionContext,
}: ChatDialogProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send stripped text version to AI for processing
      const aiContext = {
        question: questionContext.questionText,
        correctAnswer: String(questionContext.correctAnswer),
        explanation: questionContext.explanationText,
        userAnswer: questionContext.userAnswer
          ? String(questionContext.userAnswer)
          : undefined,
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
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

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get display text for correct answer
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

  // Get display text for user answer
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Trợ lý AI - Câu {questionContext.questionNumber}
              </DialogTitle>
              <DialogDescription>
                Hỏi bất kỳ điều gì về câu hỏi này để hiểu sâu hơn
              </DialogDescription>
            </div>
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
          </div>
        </DialogHeader>

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
                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  )}
                                  {isUserAnswer && !isCorrect && (
                                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Answer Summary */}
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

                  {/* Result Badge */}
                  <div className="flex items-center gap-2">
                    {questionContext.isCorrect ? (
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

                  {/* Explanation */}
                  {questionContext.explanation && (
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
                      <div className="flex-shrink-0">
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
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
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

            <form
              onSubmit={handleSubmit}
              className="flex gap-2 px-6 py-4 border-t bg-background"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi về câu hỏi này..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
