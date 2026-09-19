import React, { useRef, useEffect, useState } from "react";
import { Send } from "lucide-react";

interface ResponsiveChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isTyping: boolean;
  placeholder?: string;
  isDarkMode?: boolean;
  className?: string;
}

export default function ResponsiveChatInput({
  value,
  onChange,
  onSubmit,
  isTyping,
  placeholder = "Ketik pesan...",
  isDarkMode = false,
  className = ""
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
           // Scroll into view on keyboard open
           setTimeout(() => {
             inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
           }, 300);
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
    }, 300);
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
       className={`p-2.5 sm:p-3.5 border-t sticky bottom-0 z-[60] transition-all duration-300 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${className}`}
       style={{ paddingBottom: Math.max(12, viewportBottomPadding + 12) + 'px' }}
    >
      <form 
        className={`flex gap-2 relative border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden focus-within:ring-2 transition-all bg-white dark:bg-slate-800/90 focus-within:border-indigo-500 focus-within:ring-indigo-500/20 shadow-sm`}
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
          className={`flex-1 z-[60] bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm px-3.5 py-2.5 sm:px-4 sm:py-3 focus:outline-none focus:ring-0 disabled:opacity-50 font-sans resize-none custom-scrollbar placeholder-slate-400 dark:placeholder-slate-500 pr-12`}
          style={{ minHeight: '44px', maxHeight: '110px' }}
        />
        <button 
          type="submit" 
          disabled={!value.trim() || isTyping}
          className={`absolute right-1.5 bottom-1.5 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all disabled:opacity-30 disabled:hover:bg-indigo-600 shadow-sm`}
          aria-label="Kirim pesan"
        >
          <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </form>
    </div>
  );
}
