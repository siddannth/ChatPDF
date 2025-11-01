import { cn } from "@/lib/utils";
import { Message } from "ai/react";
import { Loader2, Sparkles, MessageSquare, Bot, User } from "lucide-react";
import React from "react";

type Props = {
  isLoading: boolean;
  messages: Message[];
};

const MessageList = ({ messages, isLoading }: Props) => {
  // Only show loader if initially loading AND no messages yet
  if (isLoading && (!messages || messages.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Loading your chat...
          </p>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center max-w-md">
          <div className="mb-6 relative inline-block">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-cyan-100 dark:from-indigo-900/30 dark:to-cyan-900/30 rounded-3xl flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
            Start a Conversation
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Ask any question about your PDF and I'll provide instant, accurate answers powered by AI.
          </p>
          
          <div className="flex flex-col gap-2 text-left">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                💡 <span className="font-medium">Try asking:</span> "What is this document about?"
              </p>
            </div>
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                📝 <span className="font-medium">Or:</span> "Summarize the main points"
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {messages.map((message) => {
        return (
          <div
            key={message.id}
            className={cn("flex gap-3 items-start", {
              "flex-row-reverse": message.role === "user",
            })}
          >
            {/* Avatar */}
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-md",
              {
                "bg-gradient-to-br from-indigo-600 to-cyan-600": message.role === "user",
                "bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800": message.role === "assistant",
              }
            )}>
              {message.role === "user" ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={cn(
                "rounded-2xl px-4 py-3 max-w-[85%] shadow-sm",
                {
                  "bg-gradient-to-br from-indigo-600 to-cyan-600 text-white": message.role === "user",
                  "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700": message.role === "assistant",
                }
              )}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          </div>
        );
      })}
      
      {/* Typing indicator when loading new message */}
      {isLoading && messages.length > 0 && (
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center shadow-md">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;