import { motion } from "framer-motion";

const TemplateCard = ({ template, onSelect, darkMode }) => {
  const cardBgClass = darkMode ? "bg-[#1a1b3a]" : "bg-white";
  const headingClass = darkMode ? "text-white" : "text-[#181A2A]";
  const subTextClass = darkMode ? "text-gray-300" : "text-[#4B5563]";

  // Template preview icons
  const getTemplateIcon = (templateId) => {
    switch (templateId) {
      case 1:
        return "📋"; // Professional
      case 2:
        return "✨"; // Modern
      case 3:
        return "🎨"; // Creative
      case 4:
        return "📄"; // Minimalist
      default:
        return "📄";
    }
  };

  // Template preview styles
  const getPreviewStyles = (templateId) => {
    switch (templateId) {
      case 1:
        return "bg-gradient-to-br from-blue-100 to-blue-200";
      case 2:
        return "bg-gradient-to-br from-purple-100 to-blue-200";
      case 3:
        return "bg-gradient-to-br from-orange-100 to-pink-200";
      case 4:
        return "bg-gradient-to-br from-gray-100 to-gray-200";
      default:
        return "bg-gradient-to-br from-blue-100 to-purple-100";
    }
  };

  return (
    <motion.div
      className={`${cardBgClass} rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border ${
        darkMode ? "border-[#23243a] hover:border-blue-500" : "border-gray-200 hover:border-blue-300"
      }`}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(template)}
    >
      {/* Template Preview */}
      <div className={`h-64 ${getPreviewStyles(template.id)} flex items-center justify-center relative`}>
        <div className="text-6xl">{getTemplateIcon(template.id)}</div>
        {/* Mock resume preview lines */}
        <div className="absolute inset-4 bg-white bg-opacity-90 rounded p-4 flex flex-col justify-center space-y-2">
          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
          <div className="h-1 bg-gray-200 rounded w-full mt-2"></div>
          <div className="h-1 bg-gray-200 rounded w-4/5"></div>
          <div className="h-1 bg-gray-200 rounded w-3/5"></div>
          <div className="h-2 bg-gray-300 rounded w-2/3 mt-2"></div>
          <div className="h-1 bg-gray-200 rounded w-full"></div>
          <div className="h-1 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
      
      {/* Template Info */}
      <div className="p-6">
        <h3 className={`text-xl font-bold mb-2 ${headingClass}`}>
          {template.name}
        </h3>
        <p className={`text-sm ${subTextClass} leading-relaxed`}>
          {template.description}
        </p>
        <div className="mt-4">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Click to select
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default TemplateCard;
