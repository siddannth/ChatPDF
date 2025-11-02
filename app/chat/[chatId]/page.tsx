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
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="hidden lg:block lg:w-[280px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
        <ChatSideBar 
          chats={_chats} 
          chatId={parseInt(chatId)} 
          isPro={isPro}  
        />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        <div className="hidden md:flex flex-1 flex-col overflow-hidden min-w-0">
          <div className="flex-shrink-0 px-4 lg:px-6 py-3 lg:py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-sm lg:text-base font-semibold text-gray-700 dark:text-gray-200 truncate">
              {currentChat.pdfName}
            </h2>
            <ThemeToggle />
          </div>
          
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
            <PDFViewer pdf_url={currentChat.pdfUrl} />
          </div>
        </div>

        <div className="flex-1 lg:w-[480px] lg:flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 flex flex-col">
          {/* Mobile Header - Only show on mobile */}
          <div className="md:hidden flex-shrink-0 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
              {currentChat.pdfName}
            </h2>
            <ThemeToggle />
          </div>
          
          <ChatComponent chatId={parseInt(chatId)} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;