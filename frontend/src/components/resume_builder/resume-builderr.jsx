import React, { useState, useEffect } from "react";
import {
  Download,
  MessageSquare,
  Star,
  ChevronRight,
  Zap,
  FileText,
  Award,
  Send,
  Sun,
  Moon,
  LoaderCircle,
} from "lucide-react";
import Navbar from "../landing/Navbar";
import SkeletonLoader from "./skeletonloader";
import WorkingPhase from "./workingphase";

// Mock Navbar Component
const Navbarr = ({ darkMode, toggleDarkMode }) => {
  return (
    <nav
      className={`${
        darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      } border-b transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span
                className={`text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent`}
              >
                ResumeAI
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Demo user data
const demoUserData = {
  personalInfo: {
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    linkedin: "linkedin.com/in/johndoe",
    website: "johndoe.dev",
  },
  summary:
    "Experienced Software Developer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable solutions and leading cross-functional teams.",
  experience: [
    {
      title: "Senior Software Developer",
      company: "Tech Solutions Inc.",
      duration: "2022 - Present",
      description:
        "Led development of scalable web applications serving 100k+ users. Implemented microservices architecture reducing load times by 40%. Mentored junior developers and conducted code reviews.",
    },
    {
      title: "Full Stack Developer",
      company: "Digital Innovations",
      duration: "2020 - 2022",
      description:
        "Developed and maintained multiple client applications using React and Node.js. Collaborated with UX/UI teams to implement responsive designs. Optimized database queries improving performance by 30%.",
    },
  ],
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "University of Technology",
      year: "2020",
      gpa: "3.8/4.0",
    },
  ],
  skills: [
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "AWS",
    "MongoDB",
    "TypeScript",
    "Docker",
  ],
  projects: [
    {
      name: "E-commerce Platform",
      description:
        "Built a full-stack e-commerce solution with React, Node.js, and MongoDB. Integrated payment processing and inventory management.",
      technologies: ["React", "Node.js", "MongoDB", "Stripe"],
    },
  ],
};

// Resume Templates
const ResumeTemplate1 = ({ userData, darkMode }) => (
  <div
    className={`w-full h-full ${
      darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
    } p-8 overflow-y-auto`}
  >
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-violet-600 pb-6 mb-6">
        <h1 className="text-4xl font-bold text-violet-600 mb-2">
          {userData.personalInfo.name}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm">
          <span>{userData.personalInfo.email}</span>
          <span>{userData.personalInfo.phone}</span>
          <span>{userData.personalInfo.location}</span>
          <span>{userData.personalInfo.linkedin}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-violet-600 mb-3">
          PROFESSIONAL SUMMARY
        </h2>
        <p className="text-sm leading-relaxed">{userData.summary}</p>
      </div>

      {/* Experience */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-violet-600 mb-3">EXPERIENCE</h2>
        {userData.experience.map((exp, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold">{exp.title}</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {exp.duration}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {exp.company}
            </p>
            <p className="text-sm leading-relaxed">{exp.description}</p>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-violet-600 mb-3">EDUCATION</h2>
        {userData.education.map((edu, index) => (
          <div key={index} className="mb-2">
            <h3 className="font-semibold">{edu.degree}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {edu.institution} - {edu.year}
            </p>
            {edu.gpa && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                GPA: {edu.gpa}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Skills */}
      <div>
        <h2 className="text-xl font-bold text-violet-600 mb-3">SKILLS</h2>
        <div className="flex flex-wrap gap-2">
          {userData.skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 text-sm rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ResumeTemplate2 = ({ userData, darkMode }) => (
  <div
    className={`w-full h-full ${
      darkMode ? "bg-gray-900" : "bg-white"
    } flex overflow-y-auto`}
  >
    {/* Sidebar */}
    <div className="w-1/3 bg-violet-600 text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {userData.personalInfo.name}
        </h1>
        <div className="space-y-1 text-sm">
          <p>{userData.personalInfo.email}</p>
          <p>{userData.personalInfo.phone}</p>
          <p>{userData.personalInfo.location}</p>
          <p>{userData.personalInfo.linkedin}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-violet-400 pb-1">
          SKILLS
        </h2>
        <div className="space-y-2">
          {userData.skills.map((skill, index) => (
            <div key={index} className="text-sm">
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3 border-b border-violet-400 pb-1">
          EDUCATION
        </h2>
        {userData.education.map((edu, index) => (
          <div key={index} className="mb-3 text-sm">
            <h3 className="font-semibold">{edu.degree}</h3>
            <p>{edu.institution}</p>
            <p>{edu.year}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Main Content */}
    <div className={`w-2/3 p-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-violet-600 mb-3">
          PROFESSIONAL SUMMARY
        </h2>
        <p className="text-sm leading-relaxed">{userData.summary}</p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-violet-600 mb-3">EXPERIENCE</h2>
        {userData.experience.map((exp, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-lg">{exp.title}</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {exp.duration}
              </span>
            </div>
            <p className="text-sm font-medium text-violet-600 mb-2">
              {exp.company}
            </p>
            <p className="text-sm leading-relaxed">{exp.description}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ResumeTemplate3 = ({ userData, darkMode }) => (
  <div
    className={`w-full h-full ${
      darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
    } p-8 overflow-y-auto`}
  >
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {userData.personalInfo.name}
        </h1>
        <div className="flex justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{userData.personalInfo.email}</span>
          <span>•</span>
          <span>{userData.personalInfo.phone}</span>
          <span>•</span>
          <span>{userData.personalInfo.location}</span>
        </div>
        <p className="mt-4 text-sm leading-relaxed max-w-3xl mx-auto">
          {userData.summary}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b-2 border-violet-600 pb-1 mb-4">
              EXPERIENCE
            </h2>
            {userData.experience.map((exp, index) => (
              <div key={index} className="mb-4">
                <h3 className="font-bold text-violet-600">{exp.title}</h3>
                <p className="font-medium">
                  {exp.company} | {exp.duration}
                </p>
                <p className="text-sm mt-1 leading-relaxed">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>

          {userData.projects && (
            <div>
              <h2 className="text-lg font-bold border-b-2 border-violet-600 pb-1 mb-4">
                PROJECTS
              </h2>
              {userData.projects.map((project, index) => (
                <div key={index} className="mb-3">
                  <h3 className="font-bold text-violet-600">{project.name}</h3>
                  <p className="text-sm leading-relaxed">
                    {project.description}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Technologies: {project.technologies.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b-2 border-violet-600 pb-1 mb-4">
              EDUCATION
            </h2>
            {userData.education.map((edu, index) => (
              <div key={index} className="mb-3">
                <h3 className="font-semibold text-sm">{edu.degree}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {edu.institution}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {edu.year}
                </p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-bold border-b-2 border-violet-600 pb-1 mb-4">
              SKILLS
            </h2>
            <div className="space-y-1">
              {userData.skills.map((skill, index) => (
                <div
                  key={index}
                  className="text-sm py-1 px-2 bg-violet-50 dark:bg-violet-900/30 rounded"
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ResumeTemplate4 = ({ userData, darkMode }) => (
  <div
    className={`w-full h-full ${
      darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
    } p-8 overflow-y-auto`}
  >
    <div className="max-w-4xl mx-auto">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {userData.personalInfo.name}
        </h1>
        <p className="mb-3">{userData.summary}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span>📧 {userData.personalInfo.email}</span>
          <span>📱 {userData.personalInfo.phone}</span>
          <span>📍 {userData.personalInfo.location}</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-violet-600 mb-3 flex items-center">
              <Award className="mr-2" size={20} />
              EXPERIENCE
            </h2>
            {userData.experience.map((exp, index) => (
              <div
                key={index}
                className="mb-4 p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20"
              >
                <h3 className="font-bold text-violet-600">{exp.title}</h3>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {exp.company}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {exp.duration}
                </p>
                <p className="text-sm leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-violet-600 mb-3 flex items-center">
              <FileText className="mr-2" size={20} />
              EDUCATION
            </h2>
            {userData.education.map((edu, index) => (
              <div
                key={index}
                className="mb-3 p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20"
              >
                <h3 className="font-semibold">{edu.degree}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {edu.institution}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {edu.year}
                </p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-xl font-bold text-violet-600 mb-3 flex items-center">
              <Zap className="mr-2" size={20} />
              SKILLS
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {userData.skills.map((skill, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-violet-800 dark:text-violet-200 text-sm rounded-lg text-center font-medium"
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Chat Component
const ChatWindow = ({ darkMode, onUpdateResume }) => {
  const [thinkloading, setthinkloading] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "ai",
      content:
        "Hello! I'm your AI resume assistant. I can help you improve your resume, add new sections, or optimize it for specific roles. What would you like to work on?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessages = [...messages, { type: "user", content: inputMessage }];
    setMessages(newMessages);

    setthinkloading(true);

    // Simulate AI response
    setTimeout(() => {
        setthinkloading(false);

      const aiResponse = generateAIResponse(inputMessage);
      setMessages([...newMessages, { type: "ai", content: aiResponse }]);

      // Simulate resume update based on message
      if (
        inputMessage.toLowerCase().includes("add") ||
        inputMessage.toLowerCase().includes("improve")
      ) {
        // This would normally call your AI service and update the resume
        onUpdateResume();
      }

      
    }, 3000);

    setInputMessage("");
    
  };

  const generateAIResponse = (message) => {
    const responses = [
      "I've analyzed your request. Let me help you enhance that section of your resume.",
      "Great idea! I can help you add more relevant experience to make your resume stand out.",
      "I'll optimize that section to better match current industry standards.",
      "Perfect! Let me suggest some improvements to make your resume more ATS-friendly.",
      "I can help you tailor this content to better match the job requirements you're targeting.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <div
      className={` flex flex-col ${
        darkMode ? "bg-gray-800" : "bg-gray-50"
      } rounded-lg mt-10`}
    >
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
          <MessageSquare className="mr-2  text-violet-600" size={20} />
          AI Assistant
        </h3>
      </div>

      <div className=" overflow-y-scroll h-[550px] p-4 space-y-4">
        <div className="">{thinkloading && <SkeletonLoader />}</div>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === "user"
                  ? "bg-violet-600 text-white"
                  : darkMode
                  ? "bg-gray-700 text-white"
                  : "bg-white text-gray-900 border"
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`p-4 border-t ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask me to improve your resume..."
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            } focus:outline-none focus:ring-2 focus:ring-violet-500`}
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Resume Builder Component
const ResumeBuilder = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [userData, setUserData] = useState(demoUserData);
  const [showATSScore, setShowATSScore] = useState(false);
  const [atsScore, setATSScore] = useState(null);

  const templates = [
    {
      id: 1,
      name: "Professional",
      component: ResumeTemplate1,
      preview: "/api/placeholder/300/400",
    },
    {
      id: 2,
      name: "Modern Sidebar",
      component: ResumeTemplate2,
      preview: "/api/placeholder/300/400",
    },
    {
      id: 3,
      name: "Clean & Simple",
      component: ResumeTemplate3,
      preview: "/api/placeholder/300/400",
    },
    {
      id: 4,
      name: "Creative Gradient",
      component: ResumeTemplate4,
      preview: "/api/placeholder/300/400",
    },
  ];

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleUpdateResume = () => {
    // Simulate resume update from AI
    console.log("Resume updated by AI");
  };

  const handleDownloadLatex = () => {
    alert("LaTeX download functionality would be implemented here");
  };

  const calculateATSScore = () => {
    // Simulate ATS score calculation
    const score = Math.floor(Math.random() * 30) + 70; // Random score between 70-100
    setATSScore(score);
    setShowATSScore(true);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  useEffect(() => {
    document.body.className = darkMode ? "dark bg-gray-900" : "bg-gray-50";
  }, [darkMode]);

  const SelectedTemplateComponent = selectedTemplate?.component;

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "dark bg-gray-900" : "bg-gray-50"
      } transition-all duration-300`}
    >
      {/* <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} /> */}
      <Navbar
        isLoggedIn={true}
        darkMode={darkMode}
        setDarkMode={toggleDarkMode}
      />

      {/* ATS Score Banner */}
      {showATSScore && (
        <div
          className={`${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } border-b p-4 mt-16  transition-all duration-300`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center ">
            <div className="flex items-center space-x-4">
              <Star className="text-violet-600" size={24} />
              <span
                className={`text-lg font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
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
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {!selectedTemplate ? (
          // Template Selection View
          <div className="text-center mb-12">
            <h1
              className={`text-4xl font-bold mb-4 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Choose Your Resume Template
            </h1>
            <p
              className={`text-lg mb-8 ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Select a professional template to get started with your AI-powered
              resume
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`${
                    darkMode
                      ? "bg-gray-800 hover:bg-gray-700 border-gray-700"
                      : "bg-white hover:bg-gray-50 border-gray-200"
                  } border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="w-full h-48 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-lg mb-4 flex items-center justify-center">
                    <FileText className="text-violet-600" size={48} />
                  </div>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {template.name}
                  </h3>
                  <div className="flex items-center justify-center text-violet-600 text-sm font-medium">
                    Select Template <ChevronRight size={16} className="ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Split Screen View
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-screen">
            {/* Chat Window */}
            <div className="order-2 lg:order-1">
              <ChatWindow
                darkMode={darkMode}
                onUpdateResume={handleUpdateResume}
              />
            </div>

            {/* Resume Preview */}
            <div className="order-1 lg:order-2">
              <div
                className={`h-full rounded-lg border ${
                  darkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-white"
                } overflow-hidden`}
              >
                <div
                  className={`p-4 border-b ${
                    darkMode
                      ? "border-gray-700 bg-gray-900"
                      : "border-gray-200 bg-white"
                  } flex justify-between items-center`}
                >
                  <h3
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Resume Preview - {selectedTemplate.name}
                  </h3>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-sm text-violet-600 hover:text-violet-700 transition-colors"
                  >
                    Change Template
                  </button>
                </div>
                <div className="h-[calc(100%-4rem)]">
                  <SelectedTemplateComponent
                    userData={userData}
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Only show when template is selected */}
        {selectedTemplate && (
          <div className="fixed bottom-6 right-6 flex space-x-4">
            <button
              onClick={calculateATSScore}
              className="flex items-center space-x-2 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-lg"
            >
              <Star size={20} />
              <span>Check ATS Score</span>
            </button>
            <button
              onClick={handleDownloadLatex}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            >
              <Download size={20} />
              <span>Download LaTeX</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilder;
