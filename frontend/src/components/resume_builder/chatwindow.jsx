import { useEffect, useRef, useState } from "react";
import SkeletonLoader from "./skeletonloader";
import PlanningPhase from "./planningphase";
import WorkingPhase from "./workingphase";
import { Paperclip, SendHorizonal, MessageSquare, Upload, File } from "lucide-react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { formatResumeToHTML } from "../../lib/formatter";

// Function to map AI response structure to our template structure
const mapResumeData = (aiResponse) => {
  if (!aiResponse || !aiResponse.resume_json || !aiResponse.resume_json.resume) {
    return null;
  }
  
  const resume = aiResponse.resume_json.resume;
  
  return {
    personal_info: {
      full_name: resume.basics?.name || 'Your Name',
      title: resume.basics?.label || 'Professional Title',
      email: resume.basics?.email || 'email@example.com',
      phone: resume.basics?.phone || '(000) 000-0000',
      location: resume.basics?.location?.city ? 
        `${resume.basics.location.city}, ${resume.basics.location.region || ''}` : 
        'City, State',
      summary: resume.basics?.summary || ''
    },
    summary: resume.basics?.summary || 'Professional summary will appear here...',
    experience: resume.experience || [],
    education: resume.education || [],
    skills: resume.skills?.keywords || []
  };
};

// Function to format resume data according to selected template
const formatResumeForTemplate = (resumeData, template) => {
  if (!resumeData || !template) return "";
  
  // Map the AI response structure to our expected structure
  const mappedData = mapResumeData(resumeData);
  if (!mappedData) return "";
  
  // Template-specific formatting logic
  switch (template.id) {
    case 1: // Professional
      return formatProfessionalTemplate(mappedData);
    case 2: // Modern Sidebar
      return formatModernSidebarTemplate(mappedData);
    case 3: // Creative
      return formatCreativeTemplate(mappedData);
    case 4: // Minimalist
      return formatMinimalistTemplate(mappedData);
    default:
      return formatResumeToHTML(mappedData);
  }
};

// Professional template formatter
const formatProfessionalTemplate = (data) => {
  console.log("Professional template data got",data)

  return `
    <div class="max-w-4xl mx-auto bg-white p-8 font-sans shadow-lg">
      <header class="text-center mb-8 border-b-4 border-violet-600 pb-6">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">${data.personal_info?.full_name || 'Your Name'}</h1>
        <p class="text-xl text-violet-600 mb-3">${data.personal_info?.title || 'Professional Title'}</p>
        <div class="text-sm text-gray-600 flex justify-center space-x-6">
          <span class="flex items-center"><span class="mr-1">📧</span>${data.personal_info?.email || 'email@example.com'}</span>
          <span class="flex items-center"><span class="mr-1">📱</span>${data.personal_info?.phone || '(000) 000-0000'}</span>
          <span class="flex items-center"><span class="mr-1">📍</span>${data.personal_info?.location || 'City, State'}</span>
        </div>
      </header>
      
      <section class="mb-8">
        <h2 class="text-2xl font-bold text-violet-600 border-b-2 border-gray-300 pb-2 mb-4">PROFESSIONAL SUMMARY</h2>
        <p class="text-gray-700 leading-relaxed text-lg">${data.summary || 'Professional summary will appear here...'}</p>
      </section>
      
      <section class="mb-8">
        <h2 class="text-2xl font-bold text-violet-600 border-b-2 border-gray-300 pb-2 mb-4">EXPERIENCE</h2>
        ${data.experience?.map(exp => `
          <div class="mb-6 p-4 border-l-4 border-violet-600 bg-gray-50">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-bold text-xl text-gray-800">${exp.position || exp.name || 'Position'}</h3>
              <span class="text-sm text-gray-600 bg-violet-100 px-3 py-1 rounded-full">${exp.startDate || exp.start_date || 'Start'} - ${exp.endDate || exp.end_date || 'End'}</span>
            </div>
            <p class="text-violet-600 font-semibold mb-3 text-lg">${exp.company || exp.organization || 'Company Name'}</p>
            <div class="text-gray-700">
              ${exp.summary ? `<p class="mb-3 text-base">${exp.summary}</p>` : ''}
              ${exp.highlights ? `
                <ul class="list-disc list-inside space-y-2">
                  ${exp.highlights.map(highlight => `<li class="text-base">${highlight}</li>`).join('')}
                </ul>
              ` : exp.responsibilities ? `
                <ul class="list-disc list-inside space-y-2">
                  ${exp.responsibilities.map(resp => `<li class="text-base">${resp}</li>`).join('')}
                </ul>
              ` : '<p class="text-base">Key responsibilities and achievements</p>'}
            </div>
          </div>
        `).join('') || '<p class="text-gray-500">Experience details will appear here...</p>'}
      </section>
      
      <div class="grid grid-cols-2 gap-8">
        <section>
          <h2 class="text-2xl font-bold text-violet-600 border-b-2 border-gray-300 pb-2 mb-4">EDUCATION</h2>
          ${data.education?.map(edu => `
            <div class="mb-4 p-4 bg-violet-50 rounded-lg">
              <h3 class="font-bold text-lg text-gray-800">${edu.studyType || edu.level || 'Degree'} ${edu.area || edu.field || 'Field of Study'}</h3>
              <p class="text-violet-600 font-semibold">${edu.institution || 'Institution'}</p>
              <p class="text-gray-600">${edu.endDate || edu.graduation_date || 'Year'}</p>
              ${edu.score ? `<p class="text-gray-600">Score: ${edu.score}</p>` : ''}
            </div>
          `).join('') || '<p class="text-gray-500">Education details will appear here...</p>'}
        </section>
        
        <section>
          <h2 class="text-2xl font-bold text-violet-600 border-b-2 border-gray-300 pb-2 mb-4">SKILLS</h2>
          <div class="flex flex-wrap gap-2">
            ${data.skills?.map(skill => `
              <span class="px-4 py-2 bg-violet-100 text-violet-800 rounded-full font-medium">${skill}</span>
            `).join('') || '<p class="text-gray-500">Skills will appear here...</p>'}
          </div>
        </section>
      </div>
    </div>
  `;
};

// Modern template formatter
const formatModernTemplate = (data) => {
  return `
    <div class="max-w-4xl mx-auto bg-white p-8 font-sans">
      <header class="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <h1 class="text-3xl font-bold mb-2">${data.personal_info?.full_name || 'Your Name'}</h1>
        <p class="text-lg opacity-90 mb-2">${data.personal_info?.title || 'Professional Title'}</p>
        <div class="text-sm opacity-80">
          <span>${data.personal_info?.email || 'email@example.com'}</span> | 
          <span>${data.personal_info?.phone || '(000) 000-0000'}</span> | 
          <span>${data.personal_info?.location || 'City, State'}</span>
        </div>
      </header>
      
      <div class="grid grid-cols-3 gap-8">
        <div class="col-span-2">
          <section class="mb-6">
            <h2 class="text-xl font-bold text-purple-600 mb-3 flex items-center">
              <span class="w-2 h-6 bg-purple-600 mr-3 rounded"></span>EXPERIENCE
            </h2>
            ${data.experience?.map(exp => `
              <div class="mb-4 pl-5 border-l-2 border-purple-200">
                <h3 class="font-bold text-gray-800">${exp.position || exp.name || 'Position'}</h3>
                <p class="text-purple-600 mb-1">${exp.company || exp.organization || 'Company Name'}</p>
                <p class="text-sm text-gray-600 mb-2">${exp.startDate || exp.start_date || 'Start'} - ${exp.endDate || exp.end_date || 'End'}</p>
                <div class="text-gray-700 text-sm">
                  ${exp.summary ? `<p class="mb-2">${exp.summary}</p>` : ''}
                  ${exp.highlights ? `
                    <ul class="list-disc list-inside">
                      ${exp.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                    </ul>
                  ` : '<p>Key achievements and responsibilities</p>'}
                </div>
              </div>
            `).join('') || '<p class="text-gray-500">Experience details will appear here...</p>'}
          </section>
          
          <section class="mb-6">
            <h2 class="text-xl font-bold text-purple-600 mb-3 flex items-center">
              <span class="w-2 h-6 bg-purple-600 mr-3 rounded"></span>SUMMARY
            </h2>
            <p class="text-gray-700 leading-relaxed pl-5">${data.summary || 'Professional summary will appear here...'}</p>
          </section>
        </div>
        
        <div>
          <section class="mb-6">
            <h2 class="text-lg font-bold text-purple-600 mb-3">SKILLS</h2>
            <div class="space-y-2">
              ${data.skills?.map(skill => `<div class="bg-purple-50 text-purple-800 px-3 py-2 rounded text-sm">${skill}</div>`).join('') || '<div class="text-gray-500">Skills will appear here...</div>'}
            </div>
          </section>
          
          <section>
            <h2 class="text-lg font-bold text-purple-600 mb-3">EDUCATION</h2>
            ${data.education?.map(edu => `
              <div class="mb-3">
                <h3 class="font-semibold text-gray-800 text-sm">${edu.studyType || edu.degree || 'Degree'} ${edu.area ? `in ${edu.area}` : ''}</h3>
                <p class="text-purple-600 text-sm">${edu.institution || 'Institution'}</p>
                <p class="text-gray-600 text-xs">${edu.endDate || edu.graduation_date || 'Year'}</p>
                ${edu.score ? `<p class="text-gray-600 text-xs">Score: ${edu.score}</p>` : ''}
              </div>
            `).join('') || '<p class="text-gray-500 text-sm">Education details will appear here...</p>'}
          </section>
        </div>
      </div>
    </div>
  `;
};

// Simple Creative template formatter
const formatSimpleCreativeTemplate = (data) => {
  return `
    <div class="max-w-4xl mx-auto bg-white font-sans p-8">
      <div class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8 rounded-xl mb-8">
        <h1 class="text-4xl font-bold mb-2">${data.personal_info?.full_name || 'Your Name'}</h1>
        <p class="text-xl mb-4">${data.summary || 'Professional summary will appear here...'}</p>
        <div class="flex flex-wrap gap-6 text-sm">
          <span>📧 ${data.personal_info?.email || 'email@example.com'}</span>
          <span>📱 ${data.personal_info?.phone || '(000) 000-0000'}</span>
          <span>📍 ${data.personal_info?.location || 'City, State'}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-8">
        <div>
          <h2 class="text-2xl font-bold text-emerald-600 mb-4 flex items-center">
            🏆 EXPERIENCE
          </h2>
          ${data.experience?.map(exp => `
            <div class="mb-6 p-6 rounded-lg bg-emerald-50 shadow-sm border-l-4 border-emerald-500">
              <h3 class="font-bold text-emerald-700 text-lg">${exp.position || exp.name || 'Position'}</h3>
              <p class="font-medium text-gray-700 mb-1">${exp.company || exp.organization || 'Company Name'}</p>
              <p class="text-sm text-gray-600 mb-3">${exp.startDate || exp.start_date || 'Start'} - ${exp.endDate || exp.end_date || 'End'}</p>
              <div class="text-gray-700">
                ${exp.summary ? `<p class="mb-2">${exp.summary}</p>` : ''}
                ${exp.highlights ? exp.highlights.map(highlight => `<p class="text-sm mb-1">• ${highlight}</p>`).join('') : '<p class="text-sm">Key responsibilities and achievements</p>'}
              </div>
            </div>
          `).join('') || '<p class="text-gray-500">Experience details will appear here...</p>'}
        </div>

        <div>
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-emerald-600 mb-4 flex items-center">
              📚 EDUCATION
            </h2>
            ${data.education?.map(edu => `
              <div class="mb-4 p-6 rounded-lg bg-emerald-50 shadow-sm">
                <h3 class="font-bold text-emerald-700">${edu.studyType || edu.level || 'Degree'}</h3>
                <p class="text-emerald-600 font-medium">${edu.institution || 'Institution'}</p>
                <p class="text-gray-600 text-sm">${edu.endDate || edu.graduation_date || 'Year'}</p>
              </div>
            `).join('') || '<p class="text-gray-500">Education details will appear here...</p>'}
          </div>

          <div>
            <h2 class="text-2xl font-bold text-emerald-600 mb-4 flex items-center">
              ⚡ SKILLS
            </h2>
            <div class="space-y-2">
              ${data.skills?.map(skill => `
                <div class="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 text-sm rounded-lg font-medium">
                  ${skill}
                </div>
              `).join('') || '<p class="text-gray-500">Skills will appear here...</p>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Enhanced Modern Sidebar template formatter
const formatModernSidebarTemplate = (data) => {
  return `
    <div class="w-full h-full flex overflow-y-auto">
      <!-- Sidebar -->
      <div class="w-1/3 bg-gradient-to-b from-blue-600 to-cyan-600 text-white p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold mb-2">${data.personal_info?.full_name || 'Your Name'}</h1>
          <p class="text-blue-100 mb-4">${data.personal_info?.title || 'Professional Title'}</p>
          <div class="space-y-2 text-sm">
            <p class="flex items-center"><span class="mr-2">📧</span>${data.personal_info?.email || 'email@example.com'}</p>
            <p class="flex items-center"><span class="mr-2">📱</span>${data.personal_info?.phone || '(000) 000-0000'}</p>
            <p class="flex items-center"><span class="mr-2">📍</span>${data.personal_info?.location || 'City, State'}</p>
          </div>
        </div>

        <div class="mb-6">
          <h2 class="text-lg font-bold mb-3 border-b border-blue-400 pb-1">SKILLS</h2>
          <div class="space-y-2">
            ${data.skills?.map(skill => `
              <div class="text-sm py-2 px-3 bg-blue-500 bg-opacity-30 rounded">
                <span>• ${skill}</span>
              </div>
            `).join('') || '<p class="text-blue-100">Skills will appear here...</p>'}
          </div>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-3 border-b border-blue-400 pb-1">EDUCATION</h2>
          ${data.education?.map(edu => `
            <div class="mb-3 text-sm">
              <h3 class="font-semibold text-blue-100">${edu.studyType || edu.level || 'Degree'} ${edu.area || edu.field || 'Field'}</h3>
              <p class="text-blue-200">${edu.institution || 'Institution'}</p>
              <p class="text-blue-300">${edu.endDate || edu.graduation_date || 'Year'}</p>
              ${edu.score ? `<p class="text-blue-300">Score: ${edu.score}</p>` : ''}
            </div>
          `).join('') || '<p class="text-blue-100">Education details will appear here...</p>'}
        </div>
      </div>

      <!-- Main Content -->
      <div class="w-2/3 p-6 bg-white">
        <div class="mb-6">
          <h2 class="text-xl font-bold text-blue-600 mb-3">PROFESSIONAL SUMMARY</h2>
          <p class="text-sm leading-relaxed text-gray-700">${data.summary || 'Professional summary will appear here...'}</p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-blue-600 mb-3">EXPERIENCE</h2>
          ${data.experience?.map(exp => `
            <div class="mb-4 pb-4 border-b border-gray-200">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-semibold text-lg text-gray-800">${exp.position || exp.name || 'Position'}</h3>
                <span class="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">${exp.startDate || exp.start_date || 'Start'} - ${exp.endDate || exp.end_date || 'End'}</span>
              </div>
              <p class="text-sm font-medium text-blue-600 mb-2">${exp.company || exp.organization || 'Company Name'}</p>
              <div class="text-sm leading-relaxed text-gray-700">
                ${exp.summary ? `<p class="mb-2">${exp.summary}</p>` : ''}
                ${exp.highlights ? `
                  <ul class="list-disc list-inside space-y-1">
                    ${exp.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                  </ul>
                ` : '<p>Key responsibilities and achievements</p>'}
              </div>
            </div>
          `).join('') || '<p class="text-gray-500">Experience details will appear here...</p>'}
        </div>
      </div>
    </div>
  `;
};

export default function ChatWindow({ darkMode, setLivePreview, jobDesc, selectedTemplate, resumeData }) {
  const [messages, setMessages] = useState([
    {
      from: "agent",
      text: `Hello! I'm your AI resume assistant. I'll help you create a professional resume using the ${selectedTemplate?.name || 'selected'} template tailored to your job description.

I can help you:
• Generate a complete resume from scratch
• Improve existing sections  
• Tailor content for specific roles
• Optimize for ATS systems
• Add missing skills or experience

Let's start building your perfect resume! What would you like me to help you with first?`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [userMessage, setuserMessage] = useState("");
  const containerRef = useRef(null);

  const token = window.localStorage.getItem("tokenCV");
  const decoded = jwtDecode(token);

  // Optional: auto-generate on mount - removed since this is now handled in parent component
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const { data } = await axios.post(
  //         `${import.meta.env.VITE_AGENT_URL}v1/chat`,
  //         {
  //           session_id: "my-test-session-1234",
  //           user_message:
  //             "Hi, please create a full resume for me based on my profile and this job description.",
  //           user_id: decoded.userId,
  //           job_description: jobDesc,
  //         }
  //       );
  //       setMessages((m) => [
  //         ...m,
  //         { from: "agent", type: "working", text: data.agent_response },
  //       ]);
  //       setLivePreview(formatResumeToHTML(data.resume_state));
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   })();
  // }, []);

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
        `${import.meta.env.VITE_AGENT_URL}agent/chat`,
        {
          message: composed,
          user_id: decoded.userId,
          job_description: jobDesc,
        }
      );

      console.log("AI Response:", data); // Debug log

      // remove planning
      setMessages((m) => m.filter((msg) => msg.type !== "planning"));

      // 4️⃣ Show working
      setMessages((m) => [
        ...m,
        { from: "agent", type: "working", text: data.response || data.agent_response || "Resume updated successfully!" },
      ]);

      // 5️⃣ Update live preview with template formatting
      // The data structure is: { response, resume_json: { resume: {...} }, ats_score, conversation_id }
      const formattedResume = formatResumeForTemplate(data, selectedTemplate);
      setLivePreview(formattedResume);
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
        className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
            msg.from === "user"
              ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
              : darkMode
              ? "bg-gray-700 text-white"
              : "bg-white text-gray-900 border border-gray-200"
          } shadow-sm`}
        >
          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`h-full flex flex-col ${
        darkMode ? "bg-gray-800" : "bg-gray-50"
      } rounded-lg overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"
        } rounded-t-lg`}
      >
        <h3
          className={`font-semibold flex items-center ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          <MessageSquare className="mr-2 text-violet-600" size={20} />
          AI Resume Assistant
        </h3>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Chat with our AI to improve your resume
        </p>
      </div>

      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[550px]"
      >
        {messages.map(renderMessage)}
        
        {loading && <SkeletonLoader />}
        {typing && (
          <div className="flex justify-start">
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900 border"
            }`}>
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div
        className={`p-4 border-t ${
          darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
        }`}
      >
        {/* File Preview */}
        {file && (
          <div className={`mb-3 p-3 rounded-lg border ${
            darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <File className="w-4 h-4 text-violet-600" />
                <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end space-x-3">
          {/* File Upload Button */}
          <label className="cursor-pointer">
            <div className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-300"
            }`}>
              <Upload className="w-5 h-5" />
            </div>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          {/* Text Input */}
          <div className="flex-1">
            <textarea
              value={userMessage}
              onChange={(e) => setuserMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me to improve your resume, add sections, or tailor it for a specific role..."
              rows={1}
              className={`w-full px-4 py-3 rounded-lg border text-sm resize-none ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-violet-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-violet-500"
              } focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-opacity-20`}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!userMessage.trim() && !file}
            className={`p-3 rounded-lg transition-all duration-200 ${
              (!userMessage.trim() && !file)
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 transform hover:scale-105"
            } text-white`}
          >
            <SendHorizonal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
