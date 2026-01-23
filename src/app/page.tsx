"use client";

import { useState, useEffect } from "react";
import { Session, Conversation, Message } from "@/types/conversation";

function formatDate(isoString: string): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatFullDate(isoString: string): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function truncateId(id: string, maxLength = 24): string {
  if (id.length <= maxLength) return id;
  return id.substring(0, maxLength) + "...";
}

// Icons
function UserIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-gray-500"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function AgentIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#1a73e8] flex items-center justify-center">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="white"
        className="text-white"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    </div>
  );
}

function PlaybookIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#1a73e8] flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-gray-400 hover:text-gray-600"
    >
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

export default function ConversationHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      setLoading(true);
      const response = await fetch("/api/sessions");
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleSessionClick(session: Session) {
    setSelectedSession(session);
    setConversationLoading(true);
    try {
      const response = await fetch(`/api/conversations/${session.id}`);
      if (!response.ok) throw new Error("Failed to fetch conversation");
      const data = await response.json();
      setConversation(data);
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setConversation(null);
    } finally {
      setConversationLoading(false);
    }
  }

  function handleCloseConversation() {
    setSelectedSession(null);
    setConversation(null);
  }

  const filteredSessions = sessions.filter(
    (session) =>
      session.id.toLowerCase().includes(filter.toLowerCase()) ||
      session.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      {/* Left Panel - Sessions List */}
      <div
        className={`${selectedSession ? "w-1/2 border-r border-[#dadce0]" : "w-full"} flex flex-col bg-white transition-all duration-300`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#dadce0]">
          <h1 className="text-xl font-normal text-[#202124]">
            Conversation History
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#dadce0]">
          <button className="px-6 py-3 text-sm font-medium text-[#1a73e8] border-b-2 border-[#1a73e8]">
            Conversations
          </button>
          <button className="px-6 py-3 text-sm font-medium text-[#5f6368] hover:text-[#202124]">
            Flow Analysis - Table
          </button>
          <button className="px-6 py-3 text-sm font-medium text-[#5f6368] hover:text-[#202124]">
            Flow Analysis - Graph
          </button>
        </div>

        {/* Description */}
        <div className="px-6 py-4 text-sm text-[#5f6368]">
          The conversation history tool provides an interface for browsing and
          analyzing actual production conversations between your app and
          end-users.{" "}
          <a href="#" className="text-[#1a73e8] hover:underline">
            Learn more
          </a>
        </div>

        {/* Filter */}
        <div className="px-6 pb-4 flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 border border-[#dadce0] rounded-md flex-1 max-w-2xl bg-white">
            <FilterIcon />
            <span className="text-sm text-[#5f6368]">Filter</span>
            <input
              type="text"
              placeholder="Filter conversations by conversation ID, display name, or turn ID"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 outline-none text-sm bg-transparent"
            />
          </div>
          <button className="text-sm text-[#1a73e8] hover:underline whitespace-nowrap">
            Export all conversations
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a73e8]"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500">
              {error}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-[#5f6368] uppercase tracking-wider">
                  <th className="pb-3 pr-4">Session Id</th>
                  <th className="pb-3 pr-4">Start time</th>
                  <th className="pb-3 pr-4">Duration</th>
                  <th className="pb-3 pr-4">Turns</th>
                  <th className="pb-3 pr-4">Channel</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className={`border-t border-[#f1f3f4] cursor-pointer hover:bg-[#f8f9fa] transition-colors ${
                      selectedSession?.id === session.id ? "bg-[#e8f0fe]" : ""
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <span className="text-sm text-[#1a73e8] hover:underline">
                        {truncateId(session.id)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-[#202124]">
                      {formatDate(session.startTime)}
                    </td>
                    <td className="py-3 pr-4 text-sm text-[#1a73e8]">
                      {session.duration}
                    </td>
                    <td className="py-3 pr-4 text-sm text-[#1a73e8]">
                      {session.turns}
                    </td>
                    <td className="py-3 pr-4 text-sm text-[#1a73e8]">
                      {session.channel}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <DeleteIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && !error && filteredSessions.length === 0 && (
            <div className="text-center py-12 text-[#5f6368]">
              No conversations found
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Conversation Detail */}
      {selectedSession && (
        <div className="w-1/2 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-[#dadce0]">
            <div className="flex items-start gap-3">
              <button
                onClick={handleCloseConversation}
                className="p-1 hover:bg-gray-100 rounded mt-1"
              >
                <CloseIcon />
              </button>
              <div>
                <h2 className="text-base font-medium text-[#202124]">
                  Conversation on {formatFullDate(selectedSession.startTime)}
                </h2>
                <p className="text-xs text-[#5f6368] mt-1">
                  ID: {selectedSession.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4 px-6 py-3 border-b border-[#dadce0]">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#202124]">Invocations</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            <button className="flex items-center gap-1 text-sm text-[#1a73e8] hover:underline">
              <span>+</span> Save as example
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-6">
            {conversationLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a73e8]"></div>
              </div>
            ) : conversation ? (
              <div className="space-y-6">
                {conversation.messages.map((message: Message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {message.role === "user" ? (
                        <div className="w-6 h-6 rounded-full bg-[#f1f3f4] flex items-center justify-center">
                          <UserIcon />
                        </div>
                      ) : message.playbookName ? (
                        <PlaybookIcon />
                      ) : (
                        <AgentIcon />
                      )}
                    </div>
                    <div className="flex-1">
                      {message.playbookName && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-[#202124]">
                            {message.playbookName}
                          </span>
                          <span className="text-xs text-[#5f6368] px-2 py-0.5 bg-[#f1f3f4] rounded">
                            Routine Playbook
                          </span>
                        </div>
                      )}
                      <div
                        className={`text-sm leading-relaxed ${
                          message.role === "user"
                            ? "text-[#202124]"
                            : "text-[#202124]"
                        }`}
                      >
                        {message.text}
                      </div>
                      {message.latency !== undefined && (
                        <div className="mt-2 inline-block px-2 py-1 text-xs text-[#5f6368] bg-[#f1f3f4] rounded">
                          Latency: {message.latency.toFixed(3)}s
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[#5f6368]">
                Failed to load conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
