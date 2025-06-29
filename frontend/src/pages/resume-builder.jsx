import { useState } from "react";
import ChatWindow from "../components/resume_builder/chatwindow";
import LivePreview from "../components/resume_builder/live";
import TemplateCard from "../components/resume_builder/TemplateCard";
import ResumeLoadingSpinner from "../components/resume_builder/ResumeLoadingSpinner";
import { AnimatePresence, motion } from "framer-motion";
import { Star, Download, ChevronRight } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import { getInitialDarkMode, setDarkModePreference } from "@/utils/theme";
import { useEffect } from "react";
import Footer from "@/components/dashboard/footer";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export default function Resume_builder() {
  const [currentStep, setCurrentStep] = useState("templates"); // templates, jobDescription, builder
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [livePreview, setLivePreview] = useState("");
  const [darkMode, setDarkMode] = useState(getInitialDarkMode());
  const [userName, setUserName] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [showJobDescModal, setShowJobDescModal] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showATSScore, setShowATSScore] = useState(false);
  const [atsScore, setATSScore] = useState(null);

  // Resume templates data with enhanced descriptions
  const resumeTemplates = [
    {
      id: 1,
      name: "Professional",
      preview: "/api/placeholder/300/400",
      description: "Clean and professional layout perfect for corporate positions",
      color: "from-violet-600 to-purple-600",
      icon: "📋",
      features: ["ATS-Friendly", "Corporate Style", "Clean Layout"]
    },
    {
      id: 2,
      name: "Modern Sidebar",
      preview: "/api/placeholder/300/400",
      description: "Contemporary sidebar design with bold visual hierarchy",
      color: "from-blue-600 to-cyan-600",
      icon: "✨",
      features: ["Eye-Catching", "Modern Design", "Split Layout"]
    },
    {
      id: 3,
      name: "Creative",
      preview: "/api/placeholder/300/400",
      description: "Bold and creative design for design and creative roles",
      color: "from-emerald-600 to-teal-600",
      icon: "🎨",
      features: ["Creative Focus", "Visual Impact", "Artistic Layout"]
    },
    {
      id: 4,
      name: "Minimalist",
      preview: "/api/placeholder/300/400",
      description: "Simple and clean design focusing on content over style",
      color: "from-gray-600 to-slate-600",
      icon: "📄",
      features: ["Clean Design", "Focus on Content", "Minimalist Style"]
    }
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("cvisionary:user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserName(parsedUser.name || "");
    }
  }, []);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowJobDescModal(true);
  };

  const handleJobDescSubmit = async () => {
    if (!jobDesc.trim()) {
      alert("Please enter a job description");
      return;
    }
    
    setShowJobDescModal(false);
    setIsGenerating(true);
    
    // Initialize AI agent with job description and user data
    await initializeResume();
  };

  const initializeResume = async () => {
    try {
      const token = window.localStorage.getItem("tokenCV");
      const decoded = jwtDecode(token);
      
      const response = await axios.post(
        `${import.meta.env.VITE_AGENT_URL}agent/chat`,
        {
          message: "Hi, please create a full resume for me based on my profile and this job description.",
          user_id: decoded.userId,
          job_description: jobDesc,
        }
      );
      
      console.log("Resume initialization response:", response.data);
      
      // Store the complete response data
      setResumeData(response.data);
      
      // Format for the selected template
      const formattedResume = formatResumeForTemplate(response.data, selectedTemplate);
      setLivePreview(formattedResume);
      
      setCurrentStep("builder");
    } catch (error) {
      console.error("Error initializing resume:", error);
      alert("Error generating resume. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateATSScore = () => {
    // Simulate ATS score calculation based on resume data
    const score = Math.floor(Math.random() * 30) + 70; // Random score between 70-100
    setATSScore(score);
    setShowATSScore(true);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const handleDownloadPDF = () => {
    // Trigger PDF download from LivePreview component
    const event = new CustomEvent('downloadResume');
    window.dispatchEvent(event);
  };

  const formatResumeForTemplate = (resumeData, template) => {
    if (!resumeData || !template) return "";
    
    // Map the AI response structure to our expected structure
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
    
    const mappedData = mapResumeData(resumeData);
    if (!mappedData) {
      return `<div class="text-center text-gray-500 py-20">
        <h3 class="text-xl mb-4">Resume Generated</h3>
        <p>Resume data received for ${template.name} template</p>
        <p class="mt-2 text-sm">Continue chatting to refine your resume...</p>
      </div>`;
    }
    
    // Basic template preview - detailed formatting is handled in ChatWindow
    return `<div class="text-center text-gray-500 py-20">
      <h3 class="text-xl mb-4">Resume Generated for ${mappedData.personal_info.full_name}</h3>
      <p class="text-lg mb-2">${mappedData.personal_info.title}</p>
      <p class="mb-4">${mappedData.summary.substring(0, 150)}...</p>
      <p class="mt-2 text-sm">Template: ${template.name} | Continue chatting to refine your resume</p>
    </div>`;
  };

  const handleSetDarkMode = (value) => {
    setDarkMode(value);
    setDarkModePreference(value);
  };

  // Theme colors matching dashboard/landing
  const bgClass = darkMode ? "bg-[#101124]" : "bg-[#f7f8fa]";
  const textClass = darkMode ? "text-white" : "text-[#181A2A]";
  const headingClass = darkMode ? "text-white" : "text-[#181A2A]";
  const subTextClass = darkMode ? "text-gray-300" : "text-[#4B5563]";
  const cardBgClass = darkMode ? "bg-[#1a1b3a]" : "bg-white";
  const modalBgClass = darkMode ? "bg-[#1a1b3a]" : "bg-white";

  return (
    <div
      className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}
    >
      <Navbar
        isLoggedIn={true}
        darkMode={darkMode}
        setDarkMode={handleSetDarkMode}
      />
      
      <AnimatePresence mode="wait">
        {/* Template Selection Step */}
        {currentStep === "templates" && (
          <motion.div
            className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-4rem)] px-4 py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-12">
              <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${headingClass}`}>
                Choose Your Resume Template
              </h1>
              <p className={`text-xl md:text-2xl max-w-3xl ${subTextClass} mb-8`}>
                Select a professional template to get started with your AI-powered resume
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className={subTextClass}>AI-Powered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className={subTextClass}>ATS-Friendly</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  <span className={subTextClass}>Professional</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full">
              {resumeTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  className={`${cardBgClass} rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border ${
                    darkMode ? "border-gray-700 hover:border-violet-500" : "border-gray-200 hover:border-violet-300"
                  }`}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className={`h-64 bg-gradient-to-br ${template.color} flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                    <div className="text-6xl relative z-10">{template.icon}</div>
                    {/* Mock resume preview lines */}
                    <div className="absolute inset-4 bg-white bg-opacity-95 rounded-lg p-4 flex flex-col justify-center space-y-2">
                      <div className="h-3 bg-gray-400 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-1 bg-gray-200 rounded w-full mt-2"></div>
                      <div className="h-1 bg-gray-200 rounded w-4/5"></div>
                      <div className="h-1 bg-gray-200 rounded w-3/5"></div>
                      <div className="h-2 bg-gray-400 rounded w-2/3 mt-2"></div>
                      <div className="h-1 bg-gray-200 rounded w-full"></div>
                      <div className="h-1 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className={`text-xl font-bold mb-2 ${headingClass}`}>
                      {template.name}
                    </h3>
                    <p className={`text-sm ${subTextClass} leading-relaxed mb-4`}>
                      {template.description}
                    </p>
                    {template.features && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-center text-violet-600 text-sm font-medium">
                      Select Template <ChevronRight size={16} className="ml-1" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Resume Builder Step */}
        {currentStep === "builder" && (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-4rem)] p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Chat Window */}
            <div className="order-2 lg:order-1">
              <ChatWindow 
                darkMode={darkMode} 
                setLivePreview={setLivePreview} 
                jobDesc={jobDesc}
                selectedTemplate={selectedTemplate}
                resumeData={resumeData}
              />
            </div>

            {/* Resume Preview */}
            <div className="order-1 lg:order-2">
              <LivePreview
                prompt={""}
                previewContent={livePreview}
                darkMode={darkMode}
                template={selectedTemplate}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ATS Score Banner */}
      {showATSScore && (
        <motion.div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } border rounded-lg p-4 shadow-lg`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-4">
            <Star className="text-violet-600" size={24} />
            <span className={`text-lg font-semibold ${headingClass}`}>
              ATS Score:
            </span>
            <span className={`text-2xl font-bold ${getScoreColor(atsScore)}`}>
              {atsScore}/100
            </span>
            <button
              onClick={() => setShowATSScore(false)}
              className={`ml-4 px-3 py-1 text-sm rounded-lg ${
                darkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } transition-colors`}
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* Floating Action Buttons - Only show when in builder mode */}
      {currentStep === "builder" && (
        <div className="fixed bottom-6 right-6 flex flex-col space-y-4">
          <motion.button
            onClick={calculateATSScore}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Star size={20} />
            <span className="font-medium">Check ATS Score</span>
          </motion.button>
          <motion.button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download size={20} />
            <span className="font-medium">Download PDF</span>
          </motion.button>
        </div>
      )}

      {/* Job Description Modal */}
      {showJobDescModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className={`${modalBgClass} rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className={`text-2xl font-bold mb-4 ${headingClass}`}>
              Enter Job Description
            </h2>
            <p className={`mb-6 ${subTextClass}`}>
              Paste the job description for the position you're applying to. This will help our AI tailor your resume accordingly.
            </p>
            <textarea
              placeholder="Paste the job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows={8}
              className={`w-full p-4 rounded-lg border ${
                darkMode 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none transition-colors`}
            />
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowJobDescModal(false);
                  setSelectedTemplate(null);
                }}
                className={`px-6 py-3 rounded-lg border font-medium ${
                  darkMode 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                } transition-all duration-200 hover:scale-105`}
              >
                Cancel
              </button>
              <button
                onClick={handleJobDescSubmit}
                disabled={!jobDesc.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  jobDesc.trim()
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 hover:scale-105 shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Start Building Resume ✨
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Loading Spinner */}
      {isGenerating && <ResumeLoadingSpinner darkMode={darkMode} />}
    </div>
  );
}
