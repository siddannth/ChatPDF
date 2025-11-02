import ChatSideBar from "@/components/ChatSideBar";
import ChatComponent from "@/components/ChatComponent";
import PDFViewer from "@/components/PDFViewer";
import { checkSubscription } from "@/lib/subscription";
import { ThemeToggle } from "@/components/ThemeToggle";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: Promise<{
    chatId: string;
  }>;
};

const ChatPage = async ({ params }: Props) => {
  const { chatId } = await params;

  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }

  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
  
  if (!_chats || _chats.length === 0) {
    return redirect("/");
  }

  const currentChat = _chats.find((chat) => chat.id === parseInt(chatId));
  
  if (!currentChat) {
    return redirect("/");
  }

  const isPro = await checkSubscription();

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
        {/* Sidebar */}
        <div className="w-[280px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
          <ChatSideBar 
            chats={_chats} 
            chatId={parseInt(chatId)} 
            isPro={isPro}  
          />
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 truncate">
              {currentChat.pdfName}
            </h2>
            <ThemeToggle />
          </div>
          
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
            <PDFViewer pdf_url={currentChat.pdfUrl} />
          </div>
        </div>

        {/* Chat Component */}
        <div className="w-[480px] flex-shrink-0 border-l border-gray-200 dark:border-gray-800">
          <ChatComponent chatId={parseInt(chatId)} />
        </div>
      </div>

      {/* Mobile Layout - Tabbed Interface */}
      <div className="md:hidden flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
        {/* Mobile Header */}
        <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
            {currentChat.pdfName}
          </h2>
          <ThemeToggle />
        </div>

        {/* Tab Content - Swipeable */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button 
              onClick={() => {
                document.getElementById('pdf-tab')?.classList.remove('hidden');
                document.getElementById('chat-tab')?.classList.add('hidden');
              }}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-b-2 border-indigo-600 dark:border-indigo-400"
            >
              📄 PDF
            </button>
            <button 
              onClick={() => {
                document.getElementById('pdf-tab')?.classList.add('hidden');
                document.getElementById('chat-tab')?.classList.remove('hidden');
              }}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 border-b-2 border-transparent"
            >
              💬 Chat
            </button>
          </div>

          {/* PDF Tab */}
          <div id="pdf-tab" className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
            <PDFViewer pdf_url={currentChat.pdfUrl} />
          </div>

          {/* Chat Tab */}
          <div id="chat-tab" className="hidden flex-1 overflow-hidden">
            <ChatComponent chatId={parseInt(chatId)} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPage;