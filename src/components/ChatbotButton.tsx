import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Bot, Trash2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Msg } from './chatbot/types';
import { WELCOME, QUICK_REPLIES } from './chatbot/constants';
import { streamChat } from './chatbot/streamChat';
import ChatMessage from './chatbot/ChatMessage';
import TypingIndicator from './chatbot/TypingIndicator';
import QuickReplies from './chatbot/QuickReplies';
import ChatInput from './chatbot/ChatInput';

let idCounter = 0;
const genId = () => `msg-${++idCounter}-${Date.now()}`;

export default function ChatbotButton() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [unread, setUnread] = useState(0);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setShowQuickReplies(false);
      const userMsg: Msg = { id: genId(), role: 'user', content: text.trim(), timestamp: new Date() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput('');
      setIsLoading(true);

      let assistantSoFar = '';
      const assistantId = genId();
      const controller = new AbortController();
      abortRef.current = controller;

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantId) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { id: assistantId, role: 'assistant', content: assistantSoFar, timestamp: new Date() }];
        });
      };

      try {
        await streamChat({
          messages: newMessages.filter((m) => m.id !== 'welcome'),
          onDelta: upsert,
          onDone: () => {
            setIsLoading(false);
            if (!open) setUnread((u) => u + 1);
          },
          onError: (msg) => {
            setMessages((prev) => [
              ...prev,
              { id: genId(), role: 'assistant', content: `⚠️ ${msg}`, timestamp: new Date() },
            ]);
            setIsLoading(false);
          },
          signal: controller.signal,
        });
      } catch (e: unknown) {
        if ((e as Error).name !== 'AbortError') {
          setMessages((prev) => [
            ...prev,
            { id: genId(), role: 'assistant', content: '⚠️ Connection error. Please try again.', timestamp: new Date() },
          ]);
        }
        setIsLoading(false);
      }
    },
    [messages, isLoading, open]
  );

  const stopGenerating = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([WELCOME]);
    setShowQuickReplies(true);
    setIsLoading(false);
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) setUnread(0);
  };

  // Listen for global "open chatbot" events from navbar/footer triggers
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setUnread(0);
    };
    window.addEventListener('authentix:open-chat', handler);
    return () => window.removeEventListener('authentix:open-chat', handler);
  }, []);

  const chatWidth = expanded ? 'w-[560px]' : 'w-[380px] sm:w-[400px]';
  const chatHeight = expanded ? 'max-h-[80vh]' : 'max-h-[520px]';

  return (
    <>
      {/* Floating button with pulse + unread badge */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Chat"
      >
        <div className="relative p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95">
          {!open && (
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
          )}
          {open ? <X className="h-6 w-6 relative z-10" /> : <MessageCircle className="h-6 w-6 relative z-10" />}
          {unread > 0 && !open && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center z-20">
              {unread}
            </span>
          )}
        </div>
      </button>

      {/* Chat window */}
      {open && (
        <div
          className={`fixed bottom-24 right-6 z-50 ${chatWidth} rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in ${chatHeight}`}
          style={{ height: expanded ? '80vh' : 'min(520px, calc(100vh - 120px))' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b bg-gradient-to-r from-primary to-primary/80 text-primary-foreground flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">Authentix Assistant</h3>
                <span className="text-[10px] opacity-80 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                  {isLoading ? 'Typing…' : 'Online'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setExpanded(!expanded)}
                title={expanded ? 'Minimize' : 'Expand'}
              >
                {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                onClick={clearChat}
                title="New conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} />
            ))}

            {/* Typing indicator when waiting for first token */}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && <TypingIndicator />}

            {/* Quick replies after welcome */}
            {showQuickReplies && messages.length === 1 && (
              <QuickReplies replies={QUICK_REPLIES} onSelect={sendMessage} disabled={isLoading} />
            )}
          </div>

          {/* Input */}
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage(input)}
            onStop={stopGenerating}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
}
