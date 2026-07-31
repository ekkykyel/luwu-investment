import React, { useRef, useEffect, useState } from "react";
import { Send } from "lucide-react";

interface ResponsiveChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isTyping: boolean;
  placeholder?: string;
  isDarkMode?: boolean;
}

export default function ResponsiveChatInput({
  value,
  onChange,
  onSubmit,
  isTyping,
  placeholder = "Ketik pesan...",
  isDarkMode = false
}: ResponsiveChatInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [viewportBottomPadding, setViewportBottomPadding] = useState(0);

  useEffect(() => {
    const handleViewportResize = () => {
      if (window.visualViewport) {
        // Calculate the difference between the full window height and the visual viewport height
        // This is typically the height of the virtual keyboard
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        if (keyboardHeight > 0) {
           setViewportBottomPadding(keyboardHeight);
        } else {
           setViewportBottomPadding(0);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportResize);
      window.visualViewport.addEventListener("scroll", handleViewportResize);
    } else {
      // Fallback for browsers that don't support VisualViewport API (old Safari, etc)
      const handleResize = () => {
        // basic check
      };
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportResize);
        window.visualViewport.removeEventListener("scroll", handleViewportResize);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping && value.trim()) {
        onSubmit();
      }
    }
  };

  const handleFocus = () => {
    setTimeout(() => {
      if (containerRef.current) {
         containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'; // Reset height
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
    <div 
       ref={containerRef}
       className={`p-3 sm:p-4 border-t sticky bottom-0 z-[60] transition-all duration-300 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700`}
       style={{ paddingBottom: Math.max(16, viewportBottomPadding + 16) + 'px' }}
    >
      <form 
        className={`flex gap-2 relative border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 transition-all shadow-inner bg-slate-50 dark:bg-slate-900 focus-within:border-blue-500 focus-within:ring-blue-500/20 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/40`}
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      >
        <textarea 
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isTyping}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          rows={1}
          className={`flex-1 z-[60] bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm px-4 py-3 focus:outline-none focus:ring-0 disabled:opacity-50 font-sans resize-none custom-scrollbar placeholder-slate-500 dark:placeholder-slate-400`}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button 
          type="submit" 
          disabled={!value.trim() || isTyping}
          className={`absolute right-2 bottom-1 w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-25`}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
