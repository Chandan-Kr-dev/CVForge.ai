import { useEffect, useRef, useState } from "react";
import SkeletonLoader from "./skeletonloader";
import PlanningPhase from "./planningphase";
import WorkingPhase from "./workingphase";
import { Paperclip, SendHorizonal } from "lucide-react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { formatResumeToHTML } from "../../lib/formatter";

export default function ChatWindow({ darkMode, setLivePreview, jobDesc }) {
  const [messages, setMessages] = useState([
    {
      from: "agent",
      text: "Hi there! I'm CVisionary, your Resume Building AI assistant. Tell me what you'd like me to build for you.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [userMessage, setuserMessage] = useState("");
  const containerRef = useRef(null);

  const token = window.localStorage.getItem("tokenCV");
  const decoded = jwtDecode(token);

  // Optional: auto-generate on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_AGENT_URL}v1/chat`,
          {
            session_id: "my-test-session-1234",
            user_message:
              "Hi, please create a full resume for me based on my profile and this job description.",
            user_id: decoded.userId,
            job_description: jobDesc,
          }
        );
        setMessages((m) => [
          ...m,
          { from: "agent", type: "working", text: data.agent_response },
        ]);
        setLivePreview(formatResumeToHTML(data.resume_state));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Always scroll to bottom
  useEffect(() => {
    const c = containerRef.current;
    if (c) c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
  }, [messages, loading, typing]);

  // Unified send handler
  const sendMessage = async () => {
    if (!userMessage.trim() && !file) return;

    // 1️⃣ Add user bubble
    const composed = file
      ? `${userMessage.trim()} 📎 [${file.name}]`
      : userMessage.trim();
    setMessages((m) => [...m, { from: "user", text: composed }]);
    setuserMessage("");
    setFile(null);

    // 2️⃣ Show planning
    setLoading(true);
    setTyping(true);
    setMessages((m) => [
      ...m,
      { from: "agent", type: "planning", text: "Let me think…" },
    ]);

    // 3️⃣ Call backend
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_AGENT_URL}v1/chat`,
        {
          session_id: "my-test-session-1234",
          user_message: composed,
          user_id: decoded.userId,
          job_description: jobDesc,
        }
      );

      // remove planning
      setMessages((m) => m.filter((msg) => msg.type !== "planning"));

      // 4️⃣ Show working
      setMessages((m) => [
        ...m,
        { from: "agent", type: "working", text: data.agent_response },
      ]);

      // 5️⃣ Update live preview
      setLivePreview(formatResumeToHTML(data.resume_state));
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { from: "agent", text: "❌ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const renderMessage = (msg, idx) => {
    if (msg.type === "planning")
      return <PlanningPhase key={idx} plan={msg.text} />;
    if (msg.type === "working")
      return <WorkingPhase key={idx} details={msg.text} />;

    return (
      <div
        key={idx}
        className={`max-w-[80%] px-4 py-3 my-2 mt-20 rounded-xl whitespace-pre-wrap text-sm ${
          msg.from === "user"
            ? "bg-[#1E1B3A] text-white self-end ml-auto"
            : darkMode
            ? "bg-[#181a2a] text-white"
            : "bg-[#f1f5f9] text-[#181A2A]"
        }`}
      >
        {msg.text}
      </div>
    );
  };

  return (
    <div className="flex flex-col justify-between h-full px-4 py-2">
      <div
        ref={containerRef}
        className="flex flex-col space-y-2 overflow-y-auto scrollbar-hide pb-4"
      >
        {messages.map(renderMessage)}
        
        {typing && (
          <div className="italic text-sm text-gray-400 dark:text-gray-500">
            CVisionary is typing…
          </div>
        )}
      </div>

      <div
        className={`flex items-center space-x-2 pt-2 border-t ${
          darkMode ? "border-[#23243a]" : "border-[#e5e7eb]"
        } mt-2`}
      >
        <label className="cursor-pointer">
          <Paperclip
            className={`w-5 h-5 ${
              darkMode
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          />
          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        {file && (
          <div
            className={`text-xs truncate max-w-[200px] ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            📎 {file.name}
          </div>
        )}

        <textarea
          value={userMessage}
          onChange={(e) => setuserMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your prompt..."
          rows={1}
          className={`flex-1 px-4 py-2 rounded-lg outline-none resize-none ${
            darkMode
              ? "bg-[#1E1B3A] text-white placeholder:text-gray-400"
              : "bg-white text-[#181A2A] placeholder:text-gray-500 border border-[#e5e7eb]"
          }`}
        />

        <button onClick={sendMessage}>
          <SendHorizonal className="text-[#2563eb] hover:text-[#1d4ed8] w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
