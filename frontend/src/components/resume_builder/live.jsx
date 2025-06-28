import { useEffect } from "react";
import html2pdf from "html2pdf.js";

export default function LivePreview({ previewContent }) {
  // Debug: log every time previewContent changes
  useEffect(() => {
    console.log("LivePreview got new content:", previewContent);
  }, [previewContent]);

  const handleDownload = () => {
    const element = document.getElementById("resume-preview");
    const opt = {
      margin: 0.5,
      filename: "CVisionary_Resume.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex flex-col items-center w-full p-4 space-y-4">
      {/* Download Button */}
      <div className="w-full max-w-[800px] flex justify-end">
        <button
          onClick={handleDownload}
          className="px-5 py-2 mt-20 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          ⬇️ Download PDF
        </button>
      </div>

      {/* Resume Preview */}
      <div
        id="resume-preview"
        className="bg-white p-8 rounded-md shadow-md w-full max-w-[800px] font-sans text-[16px] leading-relaxed text-black whitespace-pre-line"
        style={{ minHeight: "500px" }}
        // Render whatever HTML arrives, or a placeholder if empty
        dangerouslySetInnerHTML={{
          __html: previewContent || "<p class='text-gray-500'>Your resume will appear here.</p>",
        }}
      />
    </div>
  );
}
