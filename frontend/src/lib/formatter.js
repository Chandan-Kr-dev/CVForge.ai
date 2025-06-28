export function formatResumeToHTML(resume = {}) {
  const {
    summary = "",
    education = [],
    experience = [],
    projects = [],
    skills = { technical: [], soft: [] },
  } = resume;

  return `
    <div style="font-family: Arial, sans-serif; background: white; padding: 2rem; color: #000; line-height: 1.6;">
      <h2 style="border-bottom: 2px solid #ccc;">Summary</h2>
      <p>${summary}</p>

      <h2 style="border-bottom: 2px solid #ccc;">Education</h2>
      <ul>${education.map(e => `<li>${e}</li>`).join("") || "<li>None</li>"}</ul>

      <h2 style="border-bottom: 2px solid #ccc;">Experience</h2>
      <ul>${experience.map(e => `<li>${e}</li>`).join("") || "<li>None</li>"}</ul>

      <h2 style="border-bottom: 2px solid #ccc;">Projects</h2>
      <ul>${projects.map(p => `<li>${p}</li>`).join("") || "<li>None</li>"}</ul>

      <h2 style="border-bottom: 2px solid #ccc;">Skills</h2>
      <p><strong>Technical:</strong> ${skills.technical.join(", ") || "None"}</p>
      <p><strong>Soft:</strong> ${skills.soft.join(", ") || "None"}</p>
    </div>
  `;
}
