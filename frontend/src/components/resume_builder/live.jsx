import { useEffect } from "react";
import html2pdf from "html2pdf.js";

// Debug function to log the resume data structure
const debugResumeData = (data, template) => {
  console.group(`🔍 Resume Data Debug - ${template?.name || 'Unknown'} Template`);
  console.log('Raw data:', data);
  
  if (data?.resume_json?.resume) {
    const resume = data.resume_json.resume;
    console.log('📋 Basics:', resume.basics);
    console.log('💼 Experience:', resume.experience);
    console.log('🎓 Education:', resume.education);
    console.log('🛠️ Skills:', resume.skills);
  } else {
    console.warn('❌ Invalid resume data structure');
  }
  console.groupEnd();
};

export default function LivePreview({ previewContent, template, darkMode = false }) {

  useEffect(() => {
    console.log("LivePreview got new content:", previewContent);
    if (previewContent && template) {
      debugResumeData(previewContent, template);
    }
  }, [previewContent]);

  const handleDownload = () => {
    const element = document.getElementById("resume-preview");
    const opt = {
      margin: 0.5,
      filename: "CVForge_Resume.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className={`h-full rounded-lg border ${
      darkMode
        ? "border-gray-700 bg-gray-800"
        : "border-gray-200 bg-white"
    } overflow-hidden`}>
      {/* Header */}
      <div
        className={`p-4 border-b ${
          darkMode
            ? "border-gray-700 bg-gray-900"
            : "border-gray-200 bg-white"
        } flex justify-between items-center`}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${template?.color?.includes('violet') ? 'bg-violet-500' : template?.color?.includes('blue') ? 'bg-blue-500' : template?.color?.includes('emerald') ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
          <h3
            className={`font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Resume Preview - {template?.name || 'Template'}
          </h3>
        </div>
        <button
          onClick={handleDownload}
          className="text-sm text-violet-600 hover:text-violet-700 transition-colors font-medium"
        >
          Download PDF
        </button>
      </div>

      {/* Preview Content */}
      <div className="h-[calc(100%-4rem)] overflow-y-auto">
        <div className={`w-full h-full ${
          darkMode ? "bg-gray-900" : "bg-white"
        }`}>
          {previewContent ? (
            <div
              id="resume-preview"
              dangerouslySetInnerHTML={{ __html: previewContent }}
              className="w-full h-full p-6"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${template?.color || 'from-violet-100 to-purple-100'} flex items-center justify-center`}>
                  <span className="text-4xl">{template?.icon || '📄'}</span>
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}>
                  Resume Preview
                </h3>
                <p className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  Your resume will appear here as you chat with the AI
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
