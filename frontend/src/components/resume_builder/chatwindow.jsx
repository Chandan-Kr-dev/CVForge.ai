import { useEffect, useRef, useState } from "react";
import SkeletonLoader from "./skeletonloader";
import PlanningPhase from "./planningphase";
import WorkingPhase from "./workingphase";
import {
  Paperclip,
  SendHorizonal,
  MessageSquare,
  Upload,
  File,
  Download,
  Target,
} from "lucide-react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { formatResumeToHTML } from "../../lib/formatter";

// Function to map AI response structure to our template structure
const mapResumeData = (aiResponse) => {
  if (
    !aiResponse ||
    !aiResponse.resume_json ||
    !aiResponse.resume_json.resume
  ) {
    return null;
  }

  const resume = aiResponse.resume_json.resume;

  return {
    personal_info: {
      full_name: resume.basics?.name || "Your Name",
      title: resume.basics?.label || "Professional Title",
      email: resume.basics?.email || "email@example.com",
      phone: resume.basics?.phone || "(000) 000-0000",
      location: resume.basics?.location?.city
        ? `${resume.basics.location.city}, ${
            resume.basics.location.region || ""
          }`
        : "City, State",
      summary: resume.basics?.summary || "",
    },
    summary:
      resume.basics?.summary || "Professional summary will appear here...",
    experience: resume.experience || [],
    education: resume.education || [],
    skills: resume.skills?.keywords || [],
  };
};

// Function to format resume data according to selected template
const formatResumeForTemplate = (resumeData, template, userData = null) => {
  if (!resumeData || !template) return "";

  // Map the AI response structure to our expected structure
  const mappedData = mapResumeData(resumeData);
  if (!mappedData) return "";

  // Template-specific formatting logic
  switch (template.id) {
    case 1: // Professional
      return formatProfessionalTemplate(mappedData, userData);
    case 2: // Modern Sidebar
      return formatModernSidebarTemplate(mappedData, userData);
    case 3: // Creative
      return formatCreativeTemplate(mappedData, userData);
    case 4: // Minimalist
      return formatMinimalistTemplate(mappedData, userData);
    default:
      return formatResumeToHTML(mappedData);
  }
};

// Professional template formatter
const formatProfessionalTemplate = (data, userData = null) => {
  // Extract data from LinkedIn profile structure
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
  console.log("ChatWindow - formatProfessionalTemplate - extracted user data:", extractedUserData);

  // Use userData from database if available, otherwise fall back to resume data
  const personalInfo = {
    full_name: data.personal_info?.full_name || extractedUserData.name || 'Your Name',
    title: data.personal_info?.title || extractedUserData.title || 'Professional Title',
    email: extractedUserData.email || data.personal_info?.email || 'email@example.com',
    phone: extractedUserData.phone || data.personal_info?.phone || '(000) 000-0000',
    location: extractedUserData.location || data.personal_info?.location || 'City, State',
  };

  console.log("ChatWindow - Final personalInfo:", personalInfo);

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
        <p class="text-gray-700 leading-relaxed text-lg">${
          data.summary || "Professional summary will appear here..."
        }</p>
      </section>
      
      <section class="mb-8">
        <h2 class="text-2xl font-bold text-violet-600 border-b-2 border-gray-300 pb-2 mb-4">EXPERIENCE</h2>
        ${
          data.experience
            ?.map(
              (exp) => `
          <div class="mb-6 p-4 border-l-4 border-violet-600 bg-gray-50">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-bold text-xl text-gray-800">${
                exp.position || exp.name || "Position"
              }</h3>
              <span class="text-sm text-gray-600 bg-violet-100 px-3 py-1 rounded-full">${
                exp.startDate || exp.start_date || "Start"
              } - ${exp.endDate || exp.end_date || "End"}</span>
            </div>
            <p class="text-violet-600 font-semibold mb-3 text-lg">${
              exp.company || exp.organization || "Company Name"
            }</p>
            <div class="text-gray-700">
              ${
                exp.summary
                  ? `<p class="mb-3 text-base">${exp.summary}</p>`
                  : ""
              }
              ${
                exp.highlights
                  ? `
                <ul class="list-disc list-inside space-y-2">
                  ${exp.highlights
                    .map(
                      (highlight) => `<li class="text-base">${highlight}</li>`
                    )
                    .join("")}
                </ul>
              `
                  : exp.responsibilities
                  ? `
                <ul class="list-disc list-inside space-y-2">
                  ${exp.responsibilities
                    .map((resp) => `<li class="text-base">${resp}</li>`)
                    .join("")}
                </ul>
              `
                  : '<p class="text-base">Key responsibilities and achievements</p>'
              }
            </div>
          </div>
        `
            )
            .join("") ||
          '<p class="text-gray-500">Experience details will appear here...</p>'
        }
      </section>
      
      <div class="grid grid-cols-2 gap-8">
        <section>
          <h2 class="text-2xl font-bold text-violet-600 border-b-2 border-gray-300 pb-2 mb-4">EDUCATION</h2>
          ${
            data.education
              ?.map(
                (edu) => `
            <div class="mb-4 p-4 bg-violet-50 rounded-lg">
              <h3 class="font-bold text-lg text-gray-800">${
                edu.studyType || edu.level || "Degree"
              } ${edu.area || edu.field || "Field of Study"}</h3>
              <p class="text-violet-600 font-semibold">${
                edu.institution || "Institution"
              }</p>
              <p class="text-gray-600">${
                edu.endDate || edu.graduation_date || "Year"
              }</p>
              ${
                edu.score
                  ? `<p class="text-gray-600">Score: ${edu.score}</p>`
                  : ""
              }
            </div>
          `
              )
              .join("") ||
            '<p class="text-gray-500">Education details will appear here...</p>'
          }
        </section>
        
        <section>
          <h2 class="text-2xl font-bold text-violet-600 border-b-2 border-gray-300 pb-2 mb-4">SKILLS</h2>
          <div class="flex flex-wrap gap-2">
            ${
              data.skills
                ?.map(
                  (skill) => `
              <span class="px-4 py-2 bg-violet-100 text-violet-800 rounded-full font-medium">${skill}</span>
            `
                )
                .join("") ||
              '<p class="text-gray-500">Skills will appear here...</p>'
            }
          </div>
        </section>
      </div>
    </div>
  `;
};

// Modern template formatter
const formatModernTemplate = (data, userData = null) => {
  const personalInfo = {
    full_name: data.personal_info?.full_name || userData?.name || 'Your Name',
    title: data.personal_info?.title || 'Professional Title',
    email: userData?.email || data.personal_info?.email || 'email@example.com',
    phone: userData?.phone || data.personal_info?.phone || '(000) 000-0000',
    location: userData?.location || data.personal_info?.location || 'City, State',
  };

  return `
    <div class="max-w-4xl mx-auto bg-white p-8 font-sans">
      <header class="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <h1 class="text-3xl font-bold mb-2">${personalInfo.full_name}</h1>
        <p class="text-lg opacity-90 mb-2">${personalInfo.title}</p>
        <div class="text-sm opacity-80">
          <span>${personalInfo.email}</span> | 
          <span>${personalInfo.phone}</span> | 
          <span>${personalInfo.location}</span>
        </div>
      </header>
      
      <div class="grid grid-cols-3 gap-8">
        <div class="col-span-2">
          <section class="mb-6">
            <h2 class="text-xl font-bold text-purple-600 mb-3 flex items-center">
              <span class="w-2 h-6 bg-purple-600 mr-3 rounded"></span>EXPERIENCE
            </h2>
            ${
              data.experience
                ?.map(
                  (exp) => `
              <div class="mb-4 pl-5 border-l-2 border-purple-200">
                <h3 class="font-bold text-gray-800">${
                  exp.position || exp.name || "Position"
                }</h3>
                <p class="text-purple-600 mb-1">${
                  exp.company || exp.organization || "Company Name"
                }</p>
                <p class="text-sm text-gray-600 mb-2">${
                  exp.startDate || exp.start_date || "Start"
                } - ${exp.endDate || exp.end_date || "End"}</p>
                <div class="text-gray-700 text-sm">
                  ${exp.summary ? `<p class="mb-2">${exp.summary}</p>` : ""}
                  ${
                    exp.highlights
                      ? `
                    <ul class="list-disc list-inside">
                      ${exp.highlights
                        .map((highlight) => `<li>${highlight}</li>`)
                        .join("")}
                    </ul>
                  `
                      : "<p>Key achievements and responsibilities</p>"
                  }
                </div>
              </div>
            `
                )
                .join("") ||
              '<p class="text-gray-500">Experience details will appear here...</p>'
            }
          </section>
          
          <section class="mb-6">
            <h2 class="text-xl font-bold text-purple-600 mb-3 flex items-center">
              <span class="w-2 h-6 bg-purple-600 mr-3 rounded"></span>SUMMARY
            </h2>
            <p class="text-gray-700 leading-relaxed pl-5">${
              data.summary || "Professional summary will appear here..."
            }</p>
          </section>
        </div>
        
        <div>
          <section class="mb-6">
            <h2 class="text-lg font-bold text-purple-600 mb-3">SKILLS</h2>
            <div class="space-y-2">
              ${
                data.skills
                  ?.map(
                    (skill) =>
                      `<div class="bg-purple-50 text-purple-800 px-3 py-2 rounded text-sm">${skill}</div>`
                  )
                  .join("") ||
                '<div class="text-gray-500">Skills will appear here...</div>'
              }
            </div>
          </section>
          
          <section>
            <h2 class="text-lg font-bold text-purple-600 mb-3">EDUCATION</h2>
            ${
              data.education
                ?.map(
                  (edu) => `
              <div class="mb-3">
                <h3 class="font-semibold text-gray-800 text-sm">${
                  edu.studyType || edu.degree || "Degree"
                } ${edu.area ? `in ${edu.area}` : ""}</h3>
                <p class="text-purple-600 text-sm">${
                  edu.institution || "Institution"
                }</p>
                <p class="text-gray-600 text-xs">${
                  edu.endDate || edu.graduation_date || "Year"
                }</p>
                ${
                  edu.score
                    ? `<p class="text-gray-600 text-xs">Score: ${edu.score}</p>`
                    : ""
                }
              </div>
            `
                )
                .join("") ||
              '<p class="text-gray-500 text-sm">Education details will appear here...</p>'
            }
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
        <h1 class="text-4xl font-bold mb-2">${
          data.personal_info?.full_name || "Your Name"
        }</h1>
        <p class="text-xl mb-4">${
          data.summary || "Professional summary will appear here..."
        }</p>
        <div class="flex flex-wrap gap-6 text-sm">
          <span>📧 ${data.personal_info?.email || "email@example.com"}</span>
          <span>📱 ${data.personal_info?.phone || "(000) 000-0000"}</span>
          <span>📍 ${data.personal_info?.location || "City, State"}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-8">
        <div>
          <h2 class="text-2xl font-bold text-emerald-600 mb-4 flex items-center">
            🏆 EXPERIENCE
          </h2>
          ${
            data.experience
              ?.map(
                (exp) => `
            <div class="mb-6 p-6 rounded-lg bg-emerald-50 shadow-sm border-l-4 border-emerald-500">
              <h3 class="font-bold text-emerald-700 text-lg">${
                exp.position || exp.name || "Position"
              }</h3>
              <p class="font-medium text-gray-700 mb-1">${
                exp.company || exp.organization || "Company Name"
              }</p>
              <p class="text-sm text-gray-600 mb-3">${
                exp.startDate || exp.start_date || "Start"
              } - ${exp.endDate || exp.end_date || "End"}</p>
              <div class="text-gray-700">
                ${exp.summary ? `<p class="mb-2">${exp.summary}</p>` : ""}
                ${
                  exp.highlights
                    ? exp.highlights
                        .map(
                          (highlight) =>
                            `<p class="text-sm mb-1">• ${highlight}</p>`
                        )
                        .join("")
                    : '<p class="text-sm">Key responsibilities and achievements</p>'
                }
              </div>
            </div>
          `
              )
              .join("") ||
            '<p class="text-gray-500">Experience details will appear here...</p>'
          }
        </div>

        <div>
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-emerald-600 mb-4 flex items-center">
              📚 EDUCATION
            </h2>
            ${
              data.education
                ?.map(
                  (edu) => `
              <div class="mb-4 p-6 rounded-lg bg-emerald-50 shadow-sm">
                <h3 class="font-bold text-emerald-700">${
                  edu.studyType || edu.level || "Degree"
                }</h3>
                <p class="text-emerald-600 font-medium">${
                  edu.institution || "Institution"
                }</p>
                <p class="text-gray-600 text-sm">${
                  edu.endDate || edu.graduation_date || "Year"
                }</p>
              </div>
            `
                )
                .join("") ||
              '<p class="text-gray-500">Education details will appear here...</p>'
            }
          </div>

          <div>
            <h2 class="text-2xl font-bold text-emerald-600 mb-4 flex items-center">
              ⚡ SKILLS
            </h2>
            <div class="space-y-2">
              ${
                data.skills
                  ?.map(
                    (skill) => `
                <div class="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 text-sm rounded-lg font-medium">
                  ${skill}
                </div>
              `
                  )
                  .join("") ||
                '<p class="text-gray-500">Skills will appear here...</p>'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Enhanced Modern Sidebar template formatter
const formatModernSidebarTemplate = (data, userData = null) => {
  // Extract data from LinkedIn profile structure
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
      <!-- Sidebar -->
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
            ${
              data.skills
                ?.map(
                  (skill) => `
              <div class="text-sm py-2 px-3 bg-blue-500 bg-opacity-30 rounded">
                <span>• ${skill}</span>
              </div>
            `
                )
                .join("") ||
              '<p class="text-blue-100">Skills will appear here...</p>'
            }
          </div>
        </div>

        <div>
          <h2 class="text-lg font-bold mb-3 border-b border-blue-400 pb-1">EDUCATION</h2>
          ${
            data.education
              ?.map(
                (edu) => `
            <div class="mb-3 text-sm">
              <h3 class="font-semibold text-blue-100">${
                edu.studyType || edu.level || "Degree"
              } ${edu.area || edu.field || "Field"}</h3>
              <p class="text-blue-200">${edu.institution || "Institution"}</p>
              <p class="text-blue-300">${
                edu.endDate || edu.graduation_date || "Year"
              }</p>
              ${
                edu.score
                  ? `<p class="text-blue-300">Score: ${edu.score}</p>`
                  : ""
              }
            </div>
          `
              )
              .join("") ||
            '<p class="text-blue-100">Education details will appear here...</p>'
          }
        </div>
      </div>

      <!-- Main Content -->
      <div class="w-2/3 p-6 bg-white">
        <div class="mb-6">
          <h2 class="text-xl font-bold text-blue-600 mb-3">PROFESSIONAL SUMMARY</h2>
          <p class="text-sm leading-relaxed text-gray-700">${
            data.summary || "Professional summary will appear here..."
          }</p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-blue-600 mb-3">EXPERIENCE</h2>
          ${
            data.experience
              ?.map(
                (exp) => `
            <div class="mb-4 pb-4 border-b border-gray-200">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-semibold text-lg text-gray-800">${
                  exp.position || exp.name || "Position"
                }</h3>
                <span class="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">${
                  exp.startDate || exp.start_date || "Start"
                } - ${exp.endDate || exp.end_date || "End"}</span>
              </div>
              <p class="text-sm font-medium text-blue-600 mb-2">${
                exp.company || exp.organization || "Company Name"
              }</p>
              <div class="text-sm leading-relaxed text-gray-700">
                ${exp.summary ? `<p class="mb-2">${exp.summary}</p>` : ""}
                ${
                  exp.highlights
                    ? `
                  <ul class="list-disc list-inside space-y-1">
                    ${exp.highlights
                      .map((highlight) => `<li>${highlight}</li>`)
                      .join("")}
                  </ul>
                `
                    : "<p>Key responsibilities and achievements</p>"
                }
              </div>
            </div>
          `
              )
              .join("") ||
            '<p class="text-gray-500">Experience details will appear here...</p>'
          }
        </div>
      </div>
    </div>
  `;
};

// Creative template formatter
const formatCreativeTemplate = (data, userData = null) => {
  // Extract data from LinkedIn profile structure
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
        <p class="text-xl mb-4">${personalInfo.title}</p>
        <p class="text-lg mb-4 opacity-90">${
          data.summary || "Professional summary will appear here..."
        }</p>
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
          ${
            data.experience
              ?.map(
                (exp) => `
            <div class="mb-6 p-6 rounded-lg bg-emerald-50 shadow-sm border-l-4 border-emerald-500">
              <h3 class="font-bold text-emerald-700 text-lg">${
                exp.position || exp.name || "Position"
              }</h3>
              <p class="font-medium text-gray-700 mb-1">${
                exp.company || exp.organization || "Company Name"
              }</p>
              <p class="text-sm text-gray-600 mb-3">${
                exp.startDate || exp.start_date || "Start"
              } - ${exp.endDate || exp.end_date || "End"}</p>
              <div class="text-gray-700">
                ${exp.summary ? `<p class="mb-2">${exp.summary}</p>` : ""}
                ${
                  exp.highlights
                    ? exp.highlights
                        .map(
                          (highlight) =>
                            `<p class="text-sm mb-1">• ${highlight}</p>`
                        )
                        .join("")
                    : '<p class="text-sm">Key responsibilities and achievements</p>'
                }
              </div>
            </div>
          `
              )
              .join("") ||
            '<p class="text-gray-500">Experience details will appear here...</p>'
          }
        </div>

        <div>
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-emerald-600 mb-4 flex items-center">
              📚 EDUCATION
            </h2>
            ${
              data.education
                ?.map(
                  (edu) => `
              <div class="mb-4 p-6 rounded-lg bg-emerald-50 shadow-sm">
                <h3 class="font-bold text-emerald-700">${
                  edu.studyType || edu.level || "Degree"
                } ${edu.area || edu.field || "Field"}</h3>
                <p class="text-emerald-600 font-medium">${
                  edu.institution || "Institution"
                }</p>
                <p class="text-gray-600 text-sm">${
                  edu.endDate || edu.graduation_date || "Year"
                }</p>
                ${
                  edu.score
                    ? `<p class="text-gray-600 text-sm">Score: ${edu.score}</p>`
                    : ""
                }
              </div>
            `
                )
                .join("") ||
              '<p class="text-gray-500">Education details will appear here...</p>'
            }
          </div>

          <div>
            <h2 class="text-2xl font-bold text-emerald-600 mb-4 flex items-center">
              ⚡ SKILLS
            </h2>
            <div class="space-y-2">
              ${
                data.skills
                  ?.map(
                    (skill) => `
                <div class="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 text-sm rounded-lg font-medium">
                  ${skill}
                </div>
              `
                  )
                  .join("") ||
                '<p class="text-gray-500">Skills will appear here...</p>'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Minimalist template formatter
const formatMinimalistTemplate = (data, userData = null) => {
  // Extract data from LinkedIn profile structure
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
    <div class="max-w-3xl mx-auto bg-white font-sans p-8 leading-relaxed">
      <header class="text-center mb-8 pb-6 border-b-2 border-gray-200">
        <h1 class="text-3xl font-light text-gray-900 mb-2">${personalInfo.full_name}</h1>
        <p class="text-lg text-gray-600 mb-3">${personalInfo.title}</p>
        <div class="text-sm text-gray-500 space-x-4">
          <span>${personalInfo.email}</span>
          <span>•</span>
          <span>${personalInfo.phone}</span>
          <span>•</span>
          <span>${personalInfo.location}</span>
        </div>
      </header>
      
      <section class="mb-8">
        <p class="text-gray-700 leading-relaxed text-center italic">${
          data.summary || "Professional summary will appear here..."
        }</p>
      </section>
      
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">Experience</h2>
        <div class="space-y-6">
          ${
            data.experience
              ?.map(
                (exp) => `
            <div class="border-l-2 border-gray-300 pl-6">
              <div class="flex justify-between items-baseline mb-1">
                <h3 class="font-medium text-gray-900">${
                  exp.position || exp.name || "Position"
                }</h3>
                <span class="text-sm text-gray-500">${
                  exp.startDate || exp.start_date || "Start"
                } – ${exp.endDate || exp.end_date || "End"}</span>
              </div>
              <p class="text-gray-600 mb-2">${
                exp.company || exp.organization || "Company Name"
              }</p>
              <div class="text-sm text-gray-700">
                ${exp.summary ? `<p class="mb-2">${exp.summary}</p>` : ""}
                ${
                  exp.highlights
                    ? `
                  <ul class="list-disc list-inside space-y-1">
                    ${exp.highlights
                      .map((highlight) => `<li>${highlight}</li>`)
                      .join("")}
                  </ul>
                `
                    : "<p>Key responsibilities and achievements</p>"
                }
              </div>
            </div>
          `
              )
              .join("") ||
            '<p class="text-gray-500">Experience details will appear here...</p>'
          }
        </div>
      </section>
      
      <div class="grid grid-cols-2 gap-8">
        <section>
          <h2 class="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">Education</h2>
          ${
            data.education
              ?.map(
                (edu) => `
            <div class="mb-3">
              <h3 class="font-medium text-gray-900">${
                edu.studyType || edu.level || "Degree"
              } ${edu.area || edu.field || "Field"}</h3>
              <p class="text-gray-600">${edu.institution || "Institution"}</p>
              <p class="text-sm text-gray-500">${
                edu.endDate || edu.graduation_date || "Year"
              }</p>
              ${
                edu.score
                  ? `<p class="text-sm text-gray-500">Score: ${edu.score}</p>`
                  : ""
              }
            </div>
          `
              )
              .join("") ||
            '<p class="text-gray-500">Education details will appear here...</p>'
          }
        </section>
        
        <section>
          <h2 class="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">Skills</h2>
          <div class="text-sm text-gray-700 leading-relaxed">
            ${data.skills?.join(" • ") || "Skills will appear here..."}
          </div>
        </section>
      </div>
    </div>
  `;
};

export default function ChatWindow({
  darkMode,
  setLivePreview,
  jobDesc,
  selectedTemplate,
  resumeData,
  userData: propUserData, // userData passed from parent
}) {
  const [messages, setMessages] = useState([
    {
      from: "agent",
      text: `Hello! I'm your AI resume assistant. I'll help you create a professional resume using the ${
        selectedTemplate?.name || "selected"
      } template tailored to your job description.

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
  const [userData, setUserData] = useState(null);
  const [latestAIResponse, setLatestAIResponse] = useState(null);
  const [showATSModal, setShowATSModal] = useState(false);
  const containerRef = useRef(null);

  // Function to extract ATS score from AI response text
  const extractATSScoreFromText = (text) => {
    // Look for patterns like "ATS Score: 65.2%" or "Updated ATS Score: 65.2%"
    const scorePattern = /(?:Updated\s+)?ATS\s+Score:\s*(\d+(?:\.\d+)?)%/i;
    const match = text.match(scorePattern);
    return match ? parseFloat(match[1]) : null;
  };

  // Function to find the latest ATS score from messages or AI response
  const getLatestATSScore = () => {
    // First check if there's an ATS score in the structured response
    if (latestAIResponse?.ats_score?.overall_score) {
      return {
        score: latestAIResponse.ats_score.overall_score,
        source: 'structured',
        breakdown: latestAIResponse.ats_score.breakdown,
        recommendations: latestAIResponse.ats_score.recommendations
      };
    }

    // Then check recent AI messages for ATS score in text
    const recentMessages = messages.slice(-10).reverse(); // Check last 10 messages, most recent first
    for (const message of recentMessages) {
      if (message.from === 'agent' && message.text) {
        const score = extractATSScoreFromText(message.text);
        if (score !== null) {
          return {
            score: score,
            source: 'text',
            fullText: message.text
          };
        }
      }
    }

    // Check the latest AI response text
    if (latestAIResponse?.response) {
      const score = extractATSScoreFromText(latestAIResponse.response);
      if (score !== null) {
        return {
          score: score,
          source: 'text',
          fullText: latestAIResponse.response
        };
      }
    }

    return null;
  };

  // Function to show ATS Score
  const showATSScore = () => {
    const atsData = getLatestATSScore();
    
    if (!atsData) {
      // Add a message to the chat if no ATS score is available
      setMessages((m) => [
        ...m,
        {
          from: "agent",
          text: "❌ No ATS score available yet. Please generate or update your resume first to get an ATS score.",
        },
      ]);
      return;
    }
    
    // Store the ATS data for the modal
    setLatestAIResponse(prev => ({
      ...prev,
      ats_score: {
        overall_score: atsData.score,
        breakdown: atsData.breakdown || null,
        recommendations: atsData.recommendations || null,
        source: atsData.source,
        fullText: atsData.fullText
      }
    }));
    
    setShowATSModal(true);
  };

  // Function to download resume as PDF - MOVED TO MAIN RESUME BUILDER COMPONENT
  /*
  const downloadResumeAsPDF = async () => {
    // For now, we'll ask the AI to generate a PDF version
    // In a real implementation, you might use jsPDF or html2pdf
    const pdfMessage = "Please generate a PDF version of my resume for download.";
    
    setMessages((m) => [...m, { from: "user", text: pdfMessage }]);
    
    // Auto-send the PDF request
    try {
      setLoading(true);
      setTyping(true);
      
      const { data } = await axios.post(
        `${import.meta.env.VITE_AGENT_URL}agent/chat`,
        {
          message: pdfMessage,
          user_id: decoded.userId,
          job_description: jobDesc,
        }
      );

      setMessages((m) => [
        ...m,
        {
          from: "agent",
          type: "working",
          text: data.response || data.agent_response || "PDF generation request processed!",
        },
      ]);
      
      // Store the latest AI response
      setLatestAIResponse(data);
      
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { from: "agent", text: "❌ PDF generation failed. Please try again." },
      ]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };
  */

  const token = window.localStorage.getItem("tokenCV");
  const decoded = jwtDecode(token);
  console.log("Decoded JWT:", decoded);

  // Fetch user data from LinkedIn profile
  const fetchUserData = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_DEV_URL}Scrapper/linkedin/getsocialsdata`,
        { 
           userId: decoded.userId 
        }
      );
      console.log("Fetched user data:", response);
      if (response.data.success) {
        setUserData(response.data.data);
        console.log("User data fetched:", response.data.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

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
      // { from: "agent", type: "planning", text: "Let me think…" },
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

      // Store the latest AI response for ATS score functionality
      setLatestAIResponse(data);

      // remove planning
      setMessages((m) => m.filter((msg) => msg.type !== "planning"));

      // 4️⃣ Show working
      setMessages((m) => [
        ...m,
        {
          from: "agent",
          type: "working",
          text:
            data.response ||
            data.agent_response ||
            "Resume updated successfully!",
        },
      ]);

      // 5️⃣ Update live preview with template formatting
      // The data structure is: { response, resume_json: { resume: {...} }, ats_score, conversation_id }
      const currentUserData = propUserData || userData;
      const formattedResume = formatResumeForTemplate(data, selectedTemplate, currentUserData);
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
        className={`flex ${
          msg.from === "user" ? "justify-end" : "justify-start"
        } mb-4`}
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
      className={`h-full mt-10 flex flex-col ${
        darkMode ? "bg-gray-800" : "bg-gray-50"
      } rounded-lg overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"
        } rounded-t-lg`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3
              className={`font-semibold flex items-center ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <MessageSquare className="mr-2 text-violet-600" size={20} />
              AI Resume Assistant
            </h3>
            <p
              className={`text-sm mt-1 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Chat with our AI to improve your resume
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={showATSScore}
              className="flex items-center space-x-1 px-3 py-2 text-xs bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all duration-300 shadow-sm hover:shadow-md"
              title="Check ATS Score"
            >
              <Target size={14} />
              <span className="font-medium hidden sm:inline">ATS Score</span>
            </button>
            
            {/* <button
              onClick={downloadResumeAsPDF}
              className="flex items-center space-x-1 px-3 py-2 text-xs bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md"
              title="Download PDF"
            >
              <Download size={14} />
              <span className="font-medium hidden sm:inline">PDF</span>
            </button> */}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[550px]"
      >
        {messages.map(renderMessage)}

        {/* {loading && <SkeletonLoader />} */}
        {typing && (
          <div className="flex justify-start">
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                darkMode
                  ? "bg-gray-700 text-white"
                  : "bg-white text-gray-900 border"
              }`}
            >
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  AI is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div
        className={`p-4 border-t ${
          darkMode
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        {/* File Preview */}
        {file && (
          <div
            className={`mb-3 p-3 rounded-lg border ${
              darkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-white border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <File className="w-4 h-4 text-violet-600" />
                <span
                  className={`text-sm ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
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
            <div
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-300"
              }`}
            >
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
              !userMessage.trim() && !file
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 transform hover:scale-105"
            } text-white`}
          >
            <SendHorizonal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ATS Score Modal */}
      {showATSModal && latestAIResponse?.ats_score && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                🎯 ATS Score Analysis
              </h3>
              <button
                onClick={() => setShowATSModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="text-center">
                <div className="text-4xl font-bold text-violet-600 mb-2">
                  {latestAIResponse.ats_score.overall_score}%
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Overall ATS Compatibility Score
                </div>
                
                {/* Score Status */}
                <div className="mt-3">
                  {latestAIResponse.ats_score.overall_score >= 80 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      🎉 Excellent Score
                    </span>
                  ) : latestAIResponse.ats_score.overall_score >= 60 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      ⚡ Good Score
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      ⚠️ Needs Improvement
                    </span>
                  )}
                </div>
              </div>

              {/* Score Breakdown - Only show if available */}
              {latestAIResponse.ats_score.breakdown && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    📊 Score Breakdown:
                  </h4>
                  {Object.entries(latestAIResponse.ats_score.breakdown).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-medium text-violet-600">
                        {value}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations - Only show if available */}
              {latestAIResponse.ats_score.recommendations && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    💡 Recommendations:
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {Array.isArray(latestAIResponse.ats_score.recommendations) 
                      ? latestAIResponse.ats_score.recommendations.map((rec, idx) => (
                          <div key={idx} className="mb-1">• {rec}</div>
                        ))
                      : latestAIResponse.ats_score.recommendations
                    }
                  </div>
                </div>
              )}

              {/* Show source context if from text */}
              {latestAIResponse.ats_score.source === 'text' && latestAIResponse.ats_score.fullText && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                    📝 From AI Response:
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 italic">
                    {latestAIResponse.ats_score.fullText.length > 200 
                      ? latestAIResponse.ats_score.fullText.substring(0, 200) + '...'
                      : latestAIResponse.ats_score.fullText
                    }
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowATSModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowATSModal(false);
                    setuserMessage("Can you help me improve my ATS score? What specific changes should I make?");
                  }}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Get Improvement Tips
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
