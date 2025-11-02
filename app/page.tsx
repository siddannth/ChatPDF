import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, LogIn, Sparkles, FileText, UserPlus } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { checkSubscription } from "@/lib/subscription";
import SubscriptionButton from "@/components/SubscriptionButton";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;
  const isPro = await checkSubscription();
  let firstChat;
  if (userId) {
    const userChats = await db.select().from(chats).where(eq(chats.userId, userId));
    if (userChats && userChats.length > 0) {
      firstChat = userChats[0];
    }
  }
  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-black relative overflow-hidden transition-colors duration-300">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 dark:bg-indigo-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-200 dark:bg-cyan-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 dark:bg-pink-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Top Navigation */}
      <nav className="absolute top-0 w-full z-20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
              ChatPDF
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuth ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="flex gap-2">
                <Link href="/sign-in">
                  <Button variant="ghost" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700">
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>


      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl px-6 z-10">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered PDF Intelligence</span>
          </div>

          
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent leading-tight">
              Chat with any PDF
            </h1>
          </div>

        
          <div className="flex items-center gap-3 mb-8">
            {isAuth && firstChat && (
              <Link href={`/chat/${firstChat.id}`}>
                <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-6 text-base rounded-xl">
                  Go to Chats <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            {isAuth && (
              <div>
                <SubscriptionButton isPro={isPro} />
              </div>
            )}
          </div>

          {/* Subtitle */}
          <p className="max-w-2xl text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
            Join millions of students, researchers and professionals to instantly
            answer questions and understand research with AI
          </p>

         
          <div className="w-full max-w-2xl">
            {isAuth ? (
              <FileUpload />
            ) : (
              <div className="flex flex-col gap-4 items-center">
                <Link href="/sign-in">
                  <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-6 text-lg rounded-xl">
                    Login to get Started!
                    <LogIn className="w-5 h-5" />
                  </Button>
                </Link>
                
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="text-sm">Don't have an account?</span>
                  <Link href="/sign-up">
                    <Button variant="link" className="text-indigo-600 dark:text-indigo-400 font-semibold p-0 h-auto">
                      Sign Up 
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

         
          {!isAuth && (
            <div className="flex flex-wrap justify-center gap-3 mt-12">
              <div className="px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 shadow-sm">
                ⚡ Lightning Fast
              </div>
              <div className="px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 shadow-sm">
                🔒 Secure & Private
              </div>
              <div className="px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 shadow-sm">
                🎯 100% Accurate
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}