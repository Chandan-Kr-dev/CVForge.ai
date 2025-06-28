import { motion } from "framer-motion";

const ResumeLoadingSpinner = ({ darkMode }) => {
  const bgClass = darkMode ? "bg-[#101124]" : "bg-[#f7f8fa]";
  const textClass = darkMode ? "text-white" : "text-[#181A2A]";

  return (
    <div className={`fixed inset-0 ${bgClass} flex items-center justify-center z-50`}>
      <div className="text-center">
        <motion.div
          className="inline-block w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className={`mt-4 ${textClass}`}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        >
          <h3 className="text-xl font-semibold">Generating Your Resume</h3>
          <p className="text-sm mt-2">Our AI is crafting your perfect resume...</p>
        </motion.div>
      </div>
    </div>
  );
};

export default ResumeLoadingSpinner;
