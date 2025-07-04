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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Resume_builder() {
  const [currentStep, setCurrentStep] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [livePreview, setLivePreview] = useState("");
  const [darkMode, setDarkMode] = useState(getInitialDarkMode());
  const [userName, setUserName] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [showJobDescModal, setShowJobDescModal] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showATSScore, setShowATSScore] = useState(false);
  const [atsScore, setATSScore] = useState(null);

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
    
    const fetchUserData = async () => {
      try {
        const token = window.localStorage.getItem("tokenCV");
        if (!token) {
          console.error("No token found");
          return;
        }

        const decoded = jwtDecode(token);
        console.log("Fetching user data for userId:", decoded.userId);
       
        const response = await axios.get(
          `${import.meta.env.VITE_DEV_URL}Scrapper/linkedin/profile`,{user_id:decoded.userId},
          
        );
        
        if (response.data.success) {
          console.log("Raw LinkedIn profile data:", response.data.data);
          console.log("Data structure analysis:");
          console.log("- response.data.data keys:", Object.keys(response.data.data || {}));
          console.log("- Has profile property?", !!response.data.data?.profile);
          console.log("- Has email property?", !!response.data.data?.email);
          console.log("- Has name property?", !!response.data.data?.name);
          
          setUserData(response.data.data);
          console.log("User data set to state:", response.data.data);
        } else {
          console.error("API returned success: false", response.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        console.error("Error details:", error.response?.data);
      }
    };

    fetchUserData();
  }, []);

  const validateUserData = (userData) => {
    if (!userData) return "No user data available";
    
    const extractUserData = (userData) => {
      if (!userData) return {};
      const profile = userData.profile || userData;
      return {
        name: profile.name || profile.fullName || profile.firstName + ' ' + profile.lastName || userData.name,
        email: profile.email || profile.emailAddress || userData.email,
        phone: profile.phone || profile.phoneNumber || userData.phone,
        location: profile.location || profile.address || profile.city || userData.location,
        title: profile.headline || profile.title || profile.jobTitle || userData.title
      };
    };

    const extracted = extractUserData(userData);
    console.log("Validation - Extracted user data:", extracted);
    return extracted;
  };

  useEffect(() => {
    if (userData) {
      console.log("=== USER DATA VALIDATION ===");
      validateUserData(userData);
    }
  }, [userData]);

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
      
      setResumeData(response.data);
      
      const formattedResume = formatResumeForTemplate(response.data, selectedTemplate, userData);
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
    const score = Math.floor(Math.random() * 30) + 70;
    setATSScore(score);
    setShowATSScore(true);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const handleDownloadPDF = async () => {
    if (!livePreview) {
      alert('No resume content to download. Please generate a resume first.');
      return;
    }

    try {
      const userName = userData?.name || userData?.profile?.name || 'Resume';
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${userName.replace(/\s+/g, '_')}_Resume_${timestamp}.pdf`;
      
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${filename}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .no-print { 
                display: none !important; 
              }
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.5;
              color: #333;
              margin: 0;
              padding: 0;
              background: white;
            }
            .resume-container {
              width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              margin: 0 auto;
              background: white;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div class="resume-container">
            ${livePreview}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const formatResumeForTemplate = (resumeData, template, userData = null) => {
    if (!resumeData || !template) return "";
    
    console.log("Formatting resume for template:", template.name, resumeData);
    
    const mapResumeData = (aiResponse) => {
      if (!aiResponse || !aiResponse.resume_json || !aiResponse.resume_json.resume) {
        console.warn("Invalid AI response structure:", aiResponse);
        return null;
      }
      
      const resume = aiResponse.resume_json.resume;
      
      const extractUserData = (userData) => {
        if (!userData) return {};
        const profile = userData.profile || userData;
        return {
          name: profile.name || profile.fullName || profile.firstName + ' ' + profile.lastName || userData.name,
          email: profile.email || profile.emailAddress || userData.email,
          phone: profile.phone || profile.phoneNumber || userData.phone,
          location: profile.location || profile.address || profile.city || userData.location,
          title: profile.headline || profile.title || profile.jobTitle || userData.title
        };
      };

      const extractedUserData = extractUserData(userData);
      console.log("mapResumeData - extracted user data:", extractedUserData);
      
      return {
        personal_info: {
          full_name: resume.basics?.name || extractedUserData.name || 'Your Name',
          title: resume.basics?.label || extractedUserData.title || 'Professional Title',
          email: extractedUserData.email  || 'email@example.com',
          phone: extractedUserData.phone  || '(000) 000-0000',
          location: extractedUserData.location  ? 
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
      return `<div class="text-center text-red-500 py-20">
        <h3 class="text-xl mb-4">Error Processing Resume Data</h3>
        <p>Please try regenerating your resume.</p>
      </div>`;
    }
    
    return formatResumeByTemplate(mappedData, template, userData);
  };

  const formatResumeByTemplate = (data, template, userData = null) => {
    switch (template.id) {
      case 1:
        return formatProfessionalTemplate(data, userData);
      case 2:
        return formatModernSidebarTemplate(data, userData);
      case 3:
        return formatCreativeTemplate(data, userData);
      case 4:
        return formatMinimalistTemplate(data, userData);
      default:
        return formatProfessionalTemplate(data, userData);
    }
  };

  const formatProfessionalTemplate = (data, userData = null) => {
    console.log("formatProfessionalTemplate received userData:", userData);
    
    const extractUserData = (userData) => {
      if (!userData) return {};
      
      const profile = userData.profile || userData;
      
      return {
        name: profile.name || profile.fullName || profile.firstName + ' ' + profile.lastName || userData.name,
        email: profile.email || profile.emailAddress || userData.email,
        phone: profile.phone || profile.phoneNumber || userData.phone,
        location: profile.location || profile.address || profile.city || userData.location,
        title: profile.headline || profile.title || profile.jobTitle || userData.title
      };
    };

    const extractedUserData = extractUserData(userData);
    console.log("Extracted user data:", extractedUserData);

    const personalInfo = {
      full_name: data.personal_info?.full_name || extractedUserData.name || 'Your Name',
      title: data.personal_info?.title || extractedUserData.title || 'Professional Title',
      email: extractedUserData.email || data.personal_info?.email || 'email@example.com',
      phone: extractedUserData.phone || data.personal_info?.phone || '(000) 000-0000',
      location: extractedUserData.location || data.personal_info?.location || 'City, State',
    };

    console.log("Final personalInfo:", personalInfo);

    return `
      <div class="max-w-4xl mx-auto bg-white p-8 font-sans shadow-lg">
        <header class="text-center mb-8 border-b-4 border-violet-600 pb-6">
          <h1 class="text-4xl font-bold text-gray-800 mb-2">${personalInfo.full_name}</h1>
          <p class="text-xl text-violet-600 mb-3">${personalInfo.title}</p>
          <div class="text-sm text-gray-600 flex justify-center space-x-6">
            <span class="flex items-center"><span class="mr-1">📧</span>${personalInfo.email}</span>
            <span class="flex items-center"><span class="mr-1">📱</span>${personalInfo.phone}</span>
            <span class="flex items-center"><span class="mr-1">📍</span>${personalInfo.location}</span>
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

  const formatModernSidebarTemplate = (data, userData = null) => {
    const extractUserData = (userData) => {
      if (!userData) return {};
      const profile = userData.profile || userData;
      return {
        name: profile.name || profile.fullName || profile.firstName + ' ' + profile.lastName || userData.name,
        email: profile.email || profile.emailAddress || userData.email,
        phone: profile.phone || profile.phoneNumber || userData.phone,
        location: profile.location || profile.address || profile.city || userData.location,
        title: profile.headline || profile.title || profile.jobTitle || userData.title
      };
    };

    const extractedUserData = extractUserData(userData);

    const personalInfo = {
      full_name: data.personal_info?.full_name || extractedUserData.name || 'Your Name',
      title: data.personal_info?.title || extractedUserData.title || 'Professional Title',
      email: extractedUserData.email || data.personal_info?.email || 'email@example.com',
      phone: extractedUserData.phone || data.personal_info?.phone || '(000) 000-0000',
      location: extractedUserData.location || data.personal_info?.location || 'City, State',
    };

    return `
      <div class="w-full h-full flex overflow-y-auto">
        <div class="w-1/3 bg-gradient-to-b from-blue-600 to-cyan-600 text-white p-6">
          <div class="mb-6">
            <h1 class="text-2xl font-bold mb-2">${personalInfo.full_name}</h1>
            <p class="text-blue-100 mb-4">${personalInfo.title}</p>
            <div class="space-y-2 text-sm">
              <p class="flex items-center"><span class="mr-2">📧</span>${personalInfo.email}</p>
              <p class="flex items-center"><span class="mr-2">📱</span>${personalInfo.phone}</p>
              <p class="flex items-center"><span class="mr-2">📍</span>${personalInfo.location}</p>
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

  const formatCreativeTemplate = (data, userData = null) => {
    const extractUserData = (userData) => {
      if (!userData) return {};
      const profile = userData.profile || userData;
      return {
        name: profile.name || profile.fullName || profile.firstName + ' ' + profile.lastName || userData.name,
        email: profile.email || profile.emailAddress || userData.email,
        phone: profile.phone || profile.phoneNumber || userData.phone,
        location: profile.location || profile.address || profile.city || userData.location,
        title: profile.headline || profile.title || profile.jobTitle || userData.title
      };
    };

    const extractedUserData = extractUserData(userData);

    const personalInfo = {
      full_name: data.personal_info?.full_name || extractedUserData.name || 'Your Name',
      title: data.personal_info?.title || extractedUserData.title || 'Professional Title',
      email: extractedUserData.email || data.personal_info?.email || 'email@example.com',
      phone: extractedUserData.phone || data.personal_info?.phone || '(000) 000-0000',
      location: extractedUserData.location || data.personal_info?.location || 'City, State',
    };

    return `
      <div class="max-w-4xl mx-auto bg-white font-sans p-8">
        <div class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8 rounded-xl mb-8">
          <h1 class="text-4xl font-bold mb-2">${personalInfo.full_name}</h1>
          <p class="text-xl mb-4">${data.summary || 'Professional summary will appear here...'}</p>
          <div class="flex flex-wrap gap-6 text-sm">
            <span>📧 ${personalInfo.email}</span>
            <span>📱 ${personalInfo.phone}</span>
            <span>📍 ${personalInfo.location}</span>
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

  const formatMinimalistTemplate = (data, userData = null) => {
    const extractUserData = (userData) => {
      if (!userData) return {};
      const profile = userData.profile || userData;
      return {
        name: profile.name || profile.fullName || profile.firstName + ' ' + profile.lastName || userData.name,
        email: profile.email || profile.emailAddress || userData.email,
        phone: profile.phone || profile.phoneNumber || userData.phone,
        location: profile.location || profile.address || profile.city || userData.location,
        title: profile.headline || profile.title || profile.jobTitle || userData.title
      };
    };

    const extractedUserData = extractUserData(userData);

    const personalInfo = {
      full_name: data.personal_info?.full_name || extractedUserData.name || 'Your Name',
      title: data.personal_info?.title || extractedUserData.title || 'Professional Title',
      email: extractedUserData.email || data.personal_info?.email || 'email@example.com',
      phone: extractedUserData.phone || data.personal_info?.phone || '(000) 000-0000',
      location: extractedUserData.location || data.personal_info?.location || 'City, State',
    };

    return `
      <div class="max-w-4xl mx-auto bg-white p-8 font-mono text-sm leading-relaxed">
        <header class="mb-8">
          <h1 class="text-2xl font-bold text-black mb-1">${personalInfo.full_name}</h1>
          <p class="text-gray-600 mb-2">${personalInfo.title}</p>
          <p class="text-gray-500 text-xs">
            ${personalInfo.email} | 
            ${personalInfo.phone} | 
            ${personalInfo.location}
          </p>
          <hr class="mt-4 border-gray-300">
        </header>
        
        <section class="mb-6">
          <h2 class="text-sm font-bold text-black mb-2 uppercase tracking-wide">Summary</h2>
          <p class="text-gray-700">${data.summary || 'Professional summary will appear here...'}</p>
        </section>
        
        <section class="mb-6">
          <h2 class="text-sm font-bold text-black mb-2 uppercase tracking-wide">Experience</h2>
          ${data.experience?.map(exp => `
            <div class="mb-4">
              <div class="flex justify-between items-baseline mb-1">
                <h3 class="font-semibold text-black">${exp.position || exp.name || 'Position'}</h3>
                <span class="text-xs text-gray-500">${exp.startDate || exp.start_date || 'Start'} — ${exp.endDate || exp.end_date || 'End'}</span>
              </div>
              <p class="text-gray-600 mb-2">${exp.company || exp.organization || 'Company Name'}</p>
              <div class="text-gray-700 ml-4">
                ${exp.summary ? `<p class="mb-1">— ${exp.summary}</p>` : ''}
                ${exp.highlights ? exp.highlights.map(highlight => `<p class="mb-1">— ${highlight}</p>`).join('') : '<p>— Key responsibility or achievement</p>'}
              </div>
            </div>
          `).join('') || '<p class="text-gray-500">Experience details will appear here...</p>'}
        </section>
        
        <section class="mb-6">
          <h2 class="text-sm font-bold text-black mb-2 uppercase tracking-wide">Education</h2>
          ${data.education?.map(edu => `
            <div class="mb-2">
              <h3 class="font-semibold text-black">${edu.studyType || edu.level || 'Degree'} ${edu.area || edu.field || 'Field'}</h3>
              <p class="text-gray-600">${edu.institution || 'Institution'}</p>
              <p class="text-gray-500 text-xs">${edu.endDate || edu.graduation_date || 'Year'}</p>
            </div>
          `).join('') || '<p class="text-gray-500">Education details will appear here...</p>'}
        </section>
        
        <section>
          <h2 class="text-sm font-bold text-black mb-2 uppercase tracking-wide">Skills</h2>
          <p class="text-gray-700">${data.skills?.join(' • ') || 'Skills will appear here...'}</p>
        </section>
      </div>
    `;
  };

  const handleSetDarkMode = (value) => {
    setDarkMode(value);
    setDarkModePreference(value);
  };

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
        {currentStep === "templates" && (
          <motion.div
            className="flex mt-14 flex-col items-center justify-center w-full min-h-[calc(100vh-4rem)] px-4 py-8"
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

        {currentStep === "builder" && (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-4rem)] p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {userData && (
              <div className="fixed top-20 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs max-w-xs z-40">
                <h4 className="font-bold mb-2">Debug - User Data:</h4>
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
            )}

            <div className="order-2 lg:order-1">
              <ChatWindow 
                darkMode={darkMode} 
                setLivePreview={setLivePreview} 
                jobDesc={jobDesc}
                selectedTemplate={selectedTemplate}
                resumeData={resumeData}
                userData={userData}
              />
            </div>

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

      {currentStep === "builder" && (
        <div className="fixed bottom-6 right-6 flex flex-col space-y-4">
          
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

      {isGenerating && <ResumeLoadingSpinner darkMode={darkMode} />}
    </div>
  );
}
