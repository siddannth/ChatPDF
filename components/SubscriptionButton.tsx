"use client";
import React from "react";
import { Button } from "./ui/button";
import axios from "axios";
import { Sparkles, Crown, Loader2, Settings } from "lucide-react";

type Props = { isPro: boolean };

const SubscriptionButton = (props: Props) => {
  const [loading, setLoading] = React.useState(false);
  const handleSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/stripe");
      window.location.href = response.data.url;
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button 
      disabled={loading} 
      onClick={handleSubscription}
      className={`
        w-full relative overflow-hidden group transition-all duration-300
        ${props.isPro 
          ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl" 
          : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white border-0 shadow-lg hover:shadow-xl"
        }
      `}
    >
      {/* Animated background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="relative flex items-center justify-center gap-2">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : props.isPro ? (
          <>
            <Crown className="w-4 h-4" />
            <span className="font-semibold">Manage Subscription</span>
            <Settings className="w-4 h-4 opacity-70" />
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="font-semibold">Upgrade to Pro</span>
            <Crown className="w-4 h-4" />
          </>
        )}
      </div>
    </Button>
  );
};

export default SubscriptionButton;