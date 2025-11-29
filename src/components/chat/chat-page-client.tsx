"use client";

import { ChatSidebar, type ChatFriend } from "@/components/chat/chat-sidebar";
import { ChatConversation, type ChatMessageView, type ChatPartner } from "@/components/chat/chat-conversation";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

type ChatPageClientProps = {
  sidebarFriends: ChatFriend[];
  currentUserId: number;
  partner: ChatPartner | null;
  messages: ChatMessageView[];
};

export function ChatPageClient({
  sidebarFriends,
  currentUserId,
  partner,
  messages,
}: ChatPageClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="grid w-full gap-6 grid-cols-1 lg:grid-cols-[320px_1fr]">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        lg:relative lg:block
        fixed top-0 left-0 h-full z-50
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-80 max-w-[90vw] lg:w-auto lg:max-w-none
      `}>
        <div className="h-full p-4 lg:p-0">
          <ChatSidebar friends={sidebarFriends} onCloseMobile={() => setIsSidebarOpen(false)} />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-1">
        {/* Mobile Conversations Button */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center gap-2 py-3"
          >
            <MessageSquare className="h-4 w-4" />
            <span>View Conversations</span>
          </Button>
        </div>

        <ChatConversation 
          currentUserId={currentUserId} 
          partner={partner} 
          messages={messages}
        />
      </div>

      <ScrollToTop />
    </div>
  );
}