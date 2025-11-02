"use client";
import React from "react";
import { Input } from "./ui/input";
import { useChat } from "ai/react";
import { Button } from "./ui/button";
import { Send, Sparkles } from "lucide-react";
import MessageList from "./MessageList";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Message } from "ai";

type Props = { chatId: number };

const ChatComponent = ({ chatId }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.post<Message[]>("/api/get-messages", {
        chatId,
      });
      return response.data;
    },
  });

  const { input, handleInputChange, handleSubmit, messages, setMessages } = useChat({
    api: "/api/chat",
    body: {
      chatId,
    },
    initialMessages: data || [],
  });

  // Load messages from database when data is fetched
  React.useEffect(() => {
    if (data && !isLoading) {
      setMessages(data);
    }
  }, [data, isLoading, setMessages]);
  
  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer) {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-3 md:p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              AI Assistant
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ask me anything about your PDF</p>
          </div>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div 
        id="message-container"
        className="flex-1 overflow-y-auto"
      >
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Input Form - Fixed at bottom */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 px-3 md:px-4 py-3 md:py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800"
      >
        <div className="flex gap-2 md:gap-3 items-end">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask any question..."
              className="w-full pr-3 md:pr-4 py-4 md:py-6 text-sm md:text-base rounded-xl md:rounded-2xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 shadow-sm transition-all"
            />
          </div>
          <Button 
            type="submit"
            disabled={!input.trim()}
            className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          >
            <Send className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2 hidden md:block">
          Press Enter to send • AI-powered responses
        </p>
      </form>
    </div>
  );
};

export default ChatComponent;