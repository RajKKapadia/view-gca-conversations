"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
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

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function ConversationHistory() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Date filter state
  const [dateFilterType, setDateFilterType] = useState<'single' | 'range'>('single');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // Pagination state
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" });
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto-fetch conversation every 5 minutes when a session is selected
  useEffect(() => {
    if (!selectedSession) return;

    // Set up interval to refresh conversation every 5 minutes (300000 ms)
    const intervalId = setInterval(() => {
      fetchConversation(selectedSession.id, false);
    }, 300000);

    // Clean up interval on unmount or when session changes
    return () => clearInterval(intervalId);
  }, [selectedSession]);

  async function fetchSessions(pageToken?: string | null) {
    try {
      if (pageToken) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      // Build query parameters
      let url = '/api/sessions';
      const params = new URLSearchParams();
      
      if (dateFilterType === 'single' && selectedDate) {
        // For single date, set start and end to cover the full day
        const start = new Date(selectedDate);
        const end = new Date(selectedDate);
        end.setDate(end.getDate() + 1);
        
        params.append('startDate', start.toISOString());
        params.append('endDate', end.toISOString());
      } else if (dateFilterType === 'range' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1); // Include the end date
        
        params.append('startDate', start.toISOString());
        params.append('endDate', end.toISOString());
      }
      
      // Add page token if provided (for pagination)
      if (pageToken) {
        params.append('pageToken', pageToken);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      
      // Ensure data.sessions is an array (handle both old and new response formats)
      const newSessions = Array.isArray(data) ? data : (data.sessions || []);
      
      // If loading more, append to existing sessions; otherwise replace
      if (pageToken) {
        setSessions(prev => [...prev, ...newSessions]);
      } else {
        setSessions(newSessions);
      }
      
      // Store the next page token (only present in new format)
      setNextPageToken(data.nextPageToken || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }
  
  function loadMoreSessions() {
    if (nextPageToken && !loadingMore) {
      fetchSessions(nextPageToken);
    }
  }

  async function fetchConversation(sessionId: string, showLoading = true) {
    if (showLoading) {
      setConversationLoading(true);
    }
    try {
      const response = await fetch(`/api/conversations/${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch conversation");
      const data = await response.json();
      setConversation(data);
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setConversation(null);
    } finally {
      if (showLoading) {
        setConversationLoading(false);
      }
    }
  }

  async function handleSessionClick(session: Session) {
    setSelectedSession(session);
    await fetchConversation(session.id, true);
  }

  function handleCloseConversation() {
    setSelectedSession(null);
    setConversation(null);
  }

  function handleApplyDateFilter() {
    fetchSessions();
  }

  async function handleClearDateFilter() {
    // Clear the date filter state
    setSelectedDate('');
    setStartDate('');
    setEndDate('');
    
    // Fetch all sessions without date filter
    try {
      setLoading(true);
      const response = await fetch('/api/sessions');
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      
      // Handle new response format
      const newSessions = Array.isArray(data) ? data : (data.sessions || []);
      setSessions(newSessions);
      setNextPageToken(data.nextPageToken || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
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
        <div className="px-6 py-4 border-b border-[#dadce0] min-h-[77px]">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-normal text-[#202124]">
              Conversation History
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#1a73e8] hover:bg-[#f1f3f4] rounded transition-colors"
              >
                <CalendarIcon />
                Date Filter
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#5f6368] hover:bg-[#f1f3f4] rounded transition-colors"
                title={session?.user?.email || "Sign out"}
              >
                <LogoutIcon />
                Sign out
              </button>
            </div>
          </div>
          
          {/* Date Filter Panel */}
          {showDateFilter && (
            <div className="mt-4 p-4 bg-[#f8f9fa] rounded border border-[#dadce0]">
              {/* Filter Type Toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setDateFilterType('single')}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    dateFilterType === 'single'
                      ? 'bg-[#1a73e8] text-white'
                      : 'bg-white text-[#5f6368] hover:bg-[#e8f0fe]'
                  }`}
                >
                  Single Date
                </button>
                <button
                  onClick={() => setDateFilterType('range')}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    dateFilterType === 'range'
                      ? 'bg-[#1a73e8] text-white'
                      : 'bg-white text-[#5f6368] hover:bg-[#e8f0fe]'
                  }`}
                >
                  Date Range
                </button>
              </div>
              
              {/* Date Input(s) */}
              <div className="flex items-center gap-2">
                {dateFilterType === 'single' ? (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-[#dadce0] rounded focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                  />
                ) : (
                  <>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Start date"
                      className="px-3 py-2 text-sm border border-[#dadce0] rounded focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                    />
                    <span className="text-[#5f6368]">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="End date"
                      className="px-3 py-2 text-sm border border-[#dadce0] rounded focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                    />
                  </>
                )}
                
                {/* Action Buttons */}
                <button
                  onClick={handleApplyDateFilter}
                  disabled={
                    (dateFilterType === 'single' && !selectedDate) ||
                    (dateFilterType === 'range' && (!startDate || !endDate))
                  }
                  className="px-4 py-2 text-sm bg-[#1a73e8] text-white rounded hover:bg-[#1557b0] disabled:bg-[#dadce0] disabled:cursor-not-allowed transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={handleClearDateFilter}
                  className="px-4 py-2 text-sm text-[#5f6368] bg-white border border-[#dadce0] rounded hover:bg-[#f1f3f4] transition-colors"
                >
                  Clear
                </button>
              </div>
              
              {/* Active Filter Indicator */}
              {((dateFilterType === 'single' && selectedDate) ||
                (dateFilterType === 'range' && startDate && endDate)) && (
                <div className="mt-3 text-xs text-[#5f6368]">
                  Active filter:{' '}
                  {dateFilterType === 'single'
                    ? new Date(selectedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : `${new Date(startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })} - ${new Date(endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`}
                </div>
              )}
            </div>
          )}
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
            <table className="w-full mt-4">
              <thead>
                <tr className="text-left text-xs font-medium text-[#5f6368] uppercase tracking-wider">
                  <th className="pb-3 pr-4">Session Id</th>
                  <th className="pb-3 pr-4">Start time</th>
                  <th className="pb-3 pr-4">Turns</th>
                  <th className="pb-3 pr-4">Channel</th>
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
                      {session.turns}
                    </td>
                    <td className="py-3 pr-4 text-sm text-[#1a73e8]">
                      {session.channel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Load More Button */}
          {!loading && !error && filteredSessions.length > 0 && nextPageToken && (
            <div className="flex justify-center py-4">
              <button
                onClick={loadMoreSessions}
                disabled={loadingMore}
                className="px-6 py-2 text-sm bg-[#1a73e8] text-white rounded hover:bg-[#1557b0] disabled:bg-[#dadce0] disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
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
          <div className="flex items-center px-6 py-4 border-b border-[#dadce0] min-h-[70px]">
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
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-6">
            {conversationLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a73e8]"></div>
              </div>
            ) : conversation ? (
              <div className="space-y-6">
                {[...conversation.messages].reverse().map((message: Message) => (
                  <div key={message.id} className="flex gap-3 items-start">
                    <div className="flex-shrink-0">
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
