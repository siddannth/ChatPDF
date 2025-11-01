"use client";
import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { MessageCircle, PlusCircle, Trash2, Trash, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import SubscriptionButton from "./SubscriptionButton";
import axios from "axios";
import { toast } from "react-hot-toast";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
  isPro: boolean;
};

const ChatSideBar = ({ chats, chatId, isPro }: Props) => {
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [deletingAll, setDeletingAll] = React.useState(false);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this chat?")) {
      return;
    }

    try {
      setDeletingId(id);
      await axios.post(`/api/delete-chat`, { chatId: id });
      toast.success("Chat deleted!");
      window.location.href = "/";
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete chat");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete all ${chats.length} chats? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingAll(true);
      await axios.post(`/api/delete-all-chats`);
      toast.success("All chats deleted!");
      window.location.href = "/";
    } catch (error) {
      console.error("Delete all error:", error);
      toast.error("Failed to delete all chats");
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-900 dark:to-black border-r border-gray-200 dark:border-gray-800">
      {/* Header with Logo */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
            ChatPDF
          </h2>
        </div>

        <Link href="/">
          <Button className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <PlusCircle className="mr-2 w-4 h-4" />
            New Chat
          </Button>
        </Link>

        {chats.length > 0 && (
          <Button
            variant="outline"
            className="w-full mt-2 bg-transparent border-red-500/30 text-red-500 dark:text-red-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 hover:border-red-500/50 transition-all duration-200"
            onClick={handleDeleteAll}
            disabled={deletingAll}
          >
            <Trash className="mr-2 w-4 h-4" />
            {deletingAll ? "Deleting..." : "Delete All"}
          </Button>
        )}
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-auto flex flex-col gap-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
            <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
            <p>No chats yet</p>
            <p className="text-xs mt-1">Upload a PDF to start</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "rounded-xl p-3 flex items-center justify-between group transition-all duration-200",
                {
                  "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg": chat.id === chatId,
                  "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300": chat.id !== chatId,
                }
              )}
            >
              <Link 
                href={`/chat/${chat.id}`} 
                className="flex items-center flex-1 min-w-0"
              >
                <div className={cn(
                  "mr-3 p-2 rounded-lg flex-shrink-0",
                  chat.id === chatId ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700/50"
                )}>
                  <MessageCircle className="w-4 h-4" />
                </div>
                <p className="w-full overflow-hidden text-sm font-medium truncate whitespace-nowrap text-ellipsis">
                  {chat.pdfName}
                </p>
              </Link>

              <button
                onClick={(e) => handleDelete(chat.id, e)}
                disabled={deletingId === chat.id}
                className={cn(
                  "ml-2 p-2 rounded-lg transition-all duration-200 flex-shrink-0",
                  chat.id === chatId 
                    ? "opacity-0 group-hover:opacity-100 hover:bg-white/20" 
                    : "opacity-0 group-hover:opacity-100 hover:bg-red-500/20"
                )}
              >
                <Trash2
                  className={cn("w-4 h-4", {
                    "animate-spin": deletingId === chat.id,
                    "text-red-300": chat.id === chatId,
                    "text-red-500": chat.id !== chatId,
                  })}
                />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Subscription Button */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <SubscriptionButton isPro={isPro} />
      </div>
    </div>
  );
};

export default ChatSideBar;