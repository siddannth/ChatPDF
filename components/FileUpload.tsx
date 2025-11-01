"use client";

import React from "react";
import { useDropzone } from "react-dropzone";
import { Inbox, Loader2, Upload, FileText, Sparkles } from "lucide-react";
import { uploadToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation";


const FileUpload = () => {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);

  // ✅ object destructuring; v4 has isLoading, v5 uses isPending – keep as isLoading if you're on v4
  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string;
      file_name: string;
    }) => {
      const res = await axios.post("/api/create-chat", { file_key, file_name });
      return res.data as { message?: string; chatId?: string };
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit.");
        return;
      }

      try {
        setUploading(true);

        const data = await uploadToS3(file);
        if (!data?.file_key || !data.file_name) {
          toast.error("Upload failed. No key or filename returned.");
          return;
        }

        mutate(data, {
          onSuccess: ({chatId}) => {
            toast.success("Chat created successfully!");
        
            router.push(`/chat/${chatId}`);
            // e.g. router.push(`/chat/${resp.chatId}`)
          },
          onError: (err : any) => {
            const msg =
              err?.response?.data?.message ||
              err?.message ||
              "Failed to create chat.";
            toast.error(msg);
          },
        });
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "Upload failed. Check console for details.");
      } finally {
        setUploading(false);
      }
    },
  });

  const busy = uploading || isLoading;

  return (
    <div className="w-full">
      <div
        {...getRootProps({
          className: `
            relative overflow-hidden
            border-2 border-dashed rounded-2xl cursor-pointer 
            transition-all duration-300 ease-in-out
            ${isDragActive 
              ? "border-indigo-500 bg-indigo-50 scale-105" 
              : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50"
            }
            ${busy ? "cursor-not-allowed opacity-75" : ""}
            py-12 px-8
            flex justify-center items-center flex-col
            shadow-lg hover:shadow-xl
          `,
        })}
      >
        <input {...getInputProps()} disabled={busy} />
        
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-cyan-50/50 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          {busy ? (
            <>
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
                </div>
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">
                {uploading ? "Uploading..." : "Processing..."}
              </p>
              <p className="text-sm text-gray-500">
                {uploading ? "Uploading your PDF to secure storage" : "Creating your AI-powered chat"}
              </p>
            </>
          ) : (
            <>
              <div className="relative mb-4">
                <div className={`
                  w-20 h-20 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                  ${isDragActive 
                    ? "bg-gradient-to-br from-indigo-500 to-cyan-500 scale-110 shadow-xl" 
                    : "bg-gradient-to-br from-indigo-100 to-cyan-100"
                  }
                `}>
                  {isDragActive ? (
                    <Upload className="w-10 h-10 text-white animate-bounce" />
                  ) : (
                    <FileText className="w-10 h-10 text-indigo-600" />
                  )}
                </div>
                {!isDragActive && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {isDragActive ? "Drop it here!" : "Upload your PDF"}
              </h3>
              <p className="text-sm text-gray-500 mb-4 text-center max-w-xs">
                {isDragActive 
                  ? "Release to upload your document" 
                  : "Drag & drop your PDF here, or click to browse"
                }
              </p>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 font-medium">Max 10MB • PDF only</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Helper text */}
      {!busy && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Your documents are encrypted and secure
        </p>
      )}
    </div>
  );
};

export default FileUpload;