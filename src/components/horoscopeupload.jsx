import { useState } from "react";
import "./common.css";

const HoroscopeUpload = () => {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    language: "english",
    sunsign: "aries",
    prediction: "",
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");

  const languages = [
    { value: "english", label: "English" },
    { value: "hindi", label: "Hindi" },
  ];

  const sunsigns = [
    { value: "aries", label: "Aries" },
    { value: "taurus", label: "Taurus" },
    { value: "gemini", label: "Gemini" },
    { value: "cancer", label: "Cancer" },
    { value: "leo", label: "Leo" },
    { value: "virgo", label: "Virgo" },
    { value: "libra", label: "Libra" },
    { value: "scorpio", label: "Scorpio" },
    { value: "sagittarius", label: "Sagittarius" },
    { value: "capricorn", label: "Capricorn" },
    { value: "aquarius", label: "Aquarius" },
    { value: "pisces", label: "Pisces" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const convertToHtml = (text) => {
    if (!text) return "";

    let html = "";
    const lines = text.trim().split("\n");

    let inList = false;

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (/^[*•]\s/.test(trimmed)) {
        if (!inList) {
          html += "<ul>\n";
          inList = true;
        }
        html += `  <li>${trimmed.replace(/^[*•]\s/, "")}</li>\n`;
      } else if (trimmed === "") {
        if (inList) {
          html += "</ul>\n";
          inList = false;
        }
        html += "<br />\n";
      } else {
        if (inList) {
          html += "</ul>\n";
          inList = false;
        }
        html += `${trimmed}<br />\n`;
      }
    });

    if (inList) {
      html += "</ul>\n";
    }

    // ✅ Remove last <br /> if exists
    html = html.trim();
    while (html.endsWith("<br />")) {
      html = html.slice(0, -6).trim();
    }

    return html;
  };

  const handlePreview = () => {
    const html = convertToHtml(formData.prediction);
    setHtmlContent(html);
    setPreviewMode(true);
  };

  const handleSubmit = async () => {
    try {
      const htmlPrediction = convertToHtml(formData.prediction);

      const url = `https://heastro.in/heastro-service/horroscope/save?` +
        `startDate=${formData.startDate.replace(/-/g, '')}&` +
        `endDate=${formData.endDate.replace(/-/g, '')}&` +
        `language=${encodeURIComponent(formData.language)}&` +
        `sunshine=${encodeURIComponent(formData.sunsign)}&` +
        `prediction=${encodeURIComponent(htmlPrediction)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "*/*"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("API response:", responseData);

      alert("Horoscope uploaded successfully!");
      handleReset();

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload horoscope. Please try again.");
    }
  };

  const handleReset = () => {
    setFormData({
      startDate: "",
      endDate: "",
      language: "english",
      sunsign: "aries",
      prediction: "",
    });
    setPreviewMode(false);
    setHtmlContent("");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-800">Horoscope Upload Form</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="startDate">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="endDate">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="language">
              Language
            </label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="sunsign">
              Sunsign
            </label>
            <select
              id="sunsign"
              name="sunsign"
              value={formData.sunsign}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {sunsigns.map((sign) => (
                <option key={sign.value} value={sign.value}>
                  {sign.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="prediction">
            Prediction
          </label>
          <div className="flex flex-col">
            <textarea
              id="prediction"
              name="prediction"
              value={formData.prediction}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-64"
              placeholder="Write your horoscope here... Use line breaks or * for bullets."
            />
            <div className="text-sm text-gray-600 mt-1">
              Tip: Use new lines for line breaks and * or • for bullet points
            </div>
          </div>
        </div>

        {previewMode && (
          <div className="mb-6 p-4 border border-gray-300 rounded-md">
            <h3 className="text-lg font-medium mb-3">HTML Preview</h3>

            <div className="mb-4">
              <h4 className="text-md font-medium mb-2">Live Preview:</h4>
              <div
                className="p-4 bg-gray-100 rounded-md"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>

            <div>
              <h4 className="text-md font-medium mb-2">HTML Code:</h4>
              <pre className="p-4 bg-gray-800 text-green-400 rounded-md overflow-x-auto text-sm">
                {htmlContent}
              </pre>
            </div>

            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className="mt-4 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
            >
              Close Preview
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePreview}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Show HTML Preview
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
            >
              Reset
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700 transition"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default HoroscopeUpload;
