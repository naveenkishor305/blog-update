import { useState } from "react";
import "./blog.css";

const BlogUpload = () => {
  const [formData, setFormData] = useState({
    mainHeading: "",
    mainDescription: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    scheduleDate: new Date().toISOString().split("T")[0],
    article: "",
    htmlContent: "",
  });

  const [mainImageFile, setMainImageFile] = useState(null);
  const [contentFiles, setContentFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Add new state for preview
  const [previewContent, setPreviewContent] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "htmlContent") {
      setFormData({
        ...formData,
        [name]: value
      });
      setPreviewContent(cleanHtml(value));
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const cleanHtml = (html) => {
    // First, create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Function to recursively clean elements
    const cleanElement = (element) => {
      // Handle headings and formatting
      if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
        // Keep heading tags but remove their attributes
        Array.from(element.attributes).forEach(attr => {
          element.removeAttribute(attr.name);
        });
        // Ensure heading text is properly formatted
        element.textContent = element.textContent.trim();
        
        // If the heading is inside a paragraph, move it out
        if (element.parentNode.tagName === 'P') {
          const parent = element.parentNode;
          parent.parentNode.insertBefore(element, parent);
          if (parent.innerHTML.trim() === '') {
            parent.remove();
          }
        }
      } else if (element.tagName === 'STRONG' || element.tagName === 'B') {
        // Convert B to STRONG and keep it
        if (element.tagName === 'B') {
          const strong = document.createElement('strong');
          strong.innerHTML = element.innerHTML;
          element.parentNode.replaceChild(strong, element);
        }
        // Remove attributes but keep the tag
        Array.from(element.attributes).forEach(attr => {
          element.removeAttribute(attr.name);
        });
      } else if (element.tagName === 'IMG') {
        // Keep only src and alt for images
        Array.from(element.attributes).forEach(attr => {
          if (attr.name !== 'src' && attr.name !== 'alt') {
            element.removeAttribute(attr.name);
          }
        });
      } else {
        // Remove all attributes for other elements
        Array.from(element.attributes).forEach(attr => {
          element.removeAttribute(attr.name);
        });
      }

      // Clean all child elements
      Array.from(element.children).forEach(cleanElement);

      // Remove empty elements and elements with only whitespace or &nbsp;
      if (element.innerHTML.trim() === '' || 
          element.innerHTML === '&nbsp;' || 
          element.innerHTML.replace(/&nbsp;/g, '').trim() === '') {
        element.remove();
      }
    };

    // Clean the temporary div
    cleanElement(tempDiv);

    // Get the cleaned HTML and perform additional cleaning
    let cleanedHtml = tempDiv.innerHTML
      .replace(/&nbsp;/g, '') // Remove non-breaking spaces
      .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
      .replace(/<p>\s*&nbsp;\s*<\/p>/g, '') // Remove paragraphs containing only &nbsp;
      .replace(/<div>\s*<\/div>/g, '') // Remove empty divs
      .replace(/<div>\s*&nbsp;\s*<\/div>/g, '') // Remove divs containing only &nbsp;
      .replace(/\s+/g, ' ') // Remove extra whitespace
      .replace(/ style="[^"]*"/g, '') // Remove any remaining style attributes
      .replace(/ class="[^"]*"/g, '') // Remove any remaining class attributes
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove any remaining style tags
      .replace(/<!--[\s\S]*?-->/g, '') // Remove any remaining comments
      .trim();

    // Ensure content is wrapped in a div if it isn't already
    if (!cleanedHtml.startsWith('<div>')) {
      cleanedHtml = `<div>${cleanedHtml}</div>`;
    }

    // Final cleanup of any remaining empty elements
    cleanedHtml = cleanedHtml
      .replace(/<div>\s*<\/div>/g, '')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/<span>\s*<\/span>/g, '')
      .replace(/<div>\s*&nbsp;\s*<\/div>/g, '')
      .replace(/<p>\s*&nbsp;\s*<\/p>/g, '')
      .replace(/<span>\s*&nbsp;\s*<\/span>/g, '');

    return cleanedHtml;
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    
    // Clean the pasted content
    const cleanedHtml = cleanHtml(pastedText);
    setFormData({
      ...formData,
      htmlContent: cleanedHtml
    });
    setPreviewContent(cleanedHtml);
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setMainImageFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setErrorMessage("Please select an image file");
        setMainImageFile(null);
        setImagePreview(null);
      }
    }
  };

  const handleContentFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setContentFiles(files);
  };

  const convertToHtml = (text) => {
    if (!text) return "";

    // Normalize line endings and trim
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

    let html = "<div>\n";

    if (formData.mainHeading) {
      html += `  <h1>${formData.mainHeading}</h1>\n`;
    }

    // Split into paragraphs by double newlines
    const paragraphs = text.split(/\n{2,}/);

    paragraphs.forEach((paragraph) => {
      // Handle lists
      if (paragraph.match(/^(\s*([*•-]|\d+\.)\s)/m)) {
        const lines = paragraph.split(/\n/);
        let inList = false;
        let listType = null;
        lines.forEach((line) => {
          if (line.match(/^\s*[*•-] /)) {
            if (!inList || listType !== "ul") {
              if (inList) html += `  </${listType}>\n`;
              html += "  <ul>\n";
              inList = true;
              listType = "ul";
            }
            html += `    <li>${line.replace(/^\s*[*•-] /, "")}</li>\n`;
          } else if (line.match(/^\s*\d+\. /)) {
            if (!inList || listType !== "ol") {
              if (inList) html += `  </${listType}>\n`;
              html += "  <ol>\n";
              inList = true;
              listType = "ol";
            }
            html += `    <li>${line.replace(/^\s*\d+\. /, "")}</li>\n`;
          } else {
            if (inList) {
              html += `  </${listType}>\n`;
              inList = false;
              listType = null;
            }
            if (line.startsWith("# ")) {
              html += `  <h1>${line.substring(2).trim()}</h1>\n`;
            } else if (line.startsWith("## ")) {
              html += `  <h2>${line.substring(3).trim()}</h2>\n`;
            } else if (line.startsWith("### ")) {
              html += `  <h3>${line.substring(4).trim()}</h3>\n`;
            } else if (line.trim()) {
              html += `  <p>${line.trim()}</p>\n`;
            }
          }
        });
        if (inList) {
          html += `  </${listType}>\n`;
        }
      } else {
        // Headings or paragraphs
        if (paragraph.startsWith("# ")) {
          html += `  <h1>${paragraph.substring(2).trim()}</h1>\n`;
        } else if (paragraph.startsWith("## ")) {
          html += `  <h2>${paragraph.substring(3).trim()}</h2>\n`;
        } else if (paragraph.startsWith("### ")) {
          html += `  <h3>${paragraph.substring(4).trim()}</h3>\n`;
        } else if (paragraph.trim()) {
          html += `  <p>${paragraph.trim()}</p>\n`;
        }
      }
    });

    html += "</div>";
    return html;
  };

  const handlePreview = () => {
    setPreviewMode(true);
  };

  const handleClosePreview = () => {
    setPreviewMode(false);
  };

  const handleSubmit = async () => {
    if (!formData.mainHeading) {
      setErrorMessage("Main heading is required");
      return;
    }

    if (!mainImageFile) {
      setErrorMessage("Main image is required");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append("mainHeading", formData.mainHeading);
      
      if (formData.mainDescription) {
        formDataToSend.append("mainDescription", formData.mainDescription);
      }
      
      // Format dates by removing hyphens
      const startDateFormatted = formData.startDate.replace(/-/g, "");
      const endDateFormatted = formData.endDate.replace(/-/g, "");
      const scheduleDateFormatted = formData.scheduleDate.replace(/-/g, "");
      
      formDataToSend.append("startDate", startDateFormatted);
      formDataToSend.append("endDate", endDateFormatted);
      formDataToSend.append("scheduleDate", scheduleDateFormatted);
      formDataToSend.append("article", formData.article);
      
      // Clean HTML content before sending
      const cleanedHtmlContent = cleanHtml(formData.htmlContent);
      formDataToSend.append("htmlContent", cleanedHtmlContent);
      
      // Add files
      formDataToSend.append("mainImageFile", mainImageFile);
      
      if (contentFiles.length > 0) {
        contentFiles.forEach(file => {
          formDataToSend.append("contentFiles", file);
        });
      }

      // Send request to API
      const response = await fetch(
        "https://heastro.in/heastro-service/astroblogs/save", 
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      setResponseData(result);
      alert("Blog uploaded successfully!");
    } catch (error) {
      console.error("Error uploading blog:", error);
      setErrorMessage(`Error uploading blog: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      mainHeading: "",
      mainDescription: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      scheduleDate: new Date().toISOString().split("T")[0],
      article: "",
      htmlContent: "",
    });
    setMainImageFile(null);
    setContentFiles([]);
    setImagePreview(null);
    setPreviewMode(false);
    setResponseData(null);
    setErrorMessage("");
  };

  const handlePreviewChange = (e) => {
    const newContent = e.currentTarget.innerHTML;
    setPreviewContent(newContent);
    setFormData({
      ...formData,
      htmlContent: newContent
    });
  };

  const formatHeading = () => {
    const previewElement = document.getElementById('rendered-preview');
    if (previewElement) {
      previewElement.focus();
      document.execCommand('formatBlock', false, 'h2');
      const newContent = previewElement.innerHTML;
      setPreviewContent(newContent);
      setFormData({
        ...formData,
        htmlContent: newContent
      });
    }
  };

  const formatStrong = () => {
    const previewElement = document.getElementById('rendered-preview');
    if (previewElement) {
      previewElement.focus();
      document.execCommand('bold', false, null);
      const newContent = previewElement.innerHTML;
      setPreviewContent(newContent);
      setFormData({
        ...formData,
        htmlContent: newContent
      });
    }
  };

  const formatItalic = () => {
    const previewElement = document.getElementById('rendered-preview');
    if (previewElement) {
      previewElement.focus();
      document.execCommand('italic', false, null);
      const newContent = previewElement.innerHTML;
      setPreviewContent(newContent);
      setFormData({
        ...formData,
        htmlContent: newContent
      });
    }
  };

  const formatParagraph = () => {
    const previewElement = document.getElementById('rendered-preview');
    if (previewElement) {
      previewElement.focus();
      document.execCommand('formatBlock', false, 'p');
      const newContent = previewElement.innerHTML;
      setPreviewContent(newContent);
      setFormData({
        ...formData,
        htmlContent: newContent
      });
    }
  };

  const formatList = () => {
    const previewElement = document.getElementById('rendered-preview');
    if (previewElement) {
      previewElement.focus();
      document.execCommand('insertUnorderedList', false, null);
      const newContent = previewElement.innerHTML;
      setPreviewContent(newContent);
      setFormData({
        ...formData,
        htmlContent: newContent
      });
    }
  };

  const insertLineBreak = () => {
    const previewElement = document.getElementById('rendered-preview');
    if (previewElement) {
      previewElement.focus();
      document.execCommand('insertLineBreak', false, null);
      const newContent = previewElement.innerHTML;
      setPreviewContent(newContent);
      setFormData({
        ...formData,
        htmlContent: newContent
      });
    }
  };

  const handleImageInsert = () => {
    const previewElement = document.getElementById('rendered-preview');
    if (previewElement) {
      previewElement.focus();
      const imageUrl = prompt('Enter image URL:');
      if (imageUrl) {
        document.execCommand('insertImage', false, imageUrl);
        const newContent = previewElement.innerHTML;
        setPreviewContent(newContent);
        setFormData({
          ...formData,
          htmlContent: newContent
        });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-800">AstroBhagya Blog Upload</h1>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-grey-700 font-medium mb-2" htmlFor="mainHeading">
            Main Heading <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="mainHeading"
            name="mainHeading"
            value={formData.mainHeading}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-grey-700 font-medium mb-2" htmlFor="mainDescription">
            Main Description
          </label>
          <textarea
            id="mainDescription"
            name="mainDescription"
            value={formData.mainDescription}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows="2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-grey-700 font-medium mb-2" htmlFor="mainImageFile">
            Main Image <span className="text-red-600">*</span>
          </label>
          <input
            type="file"
            id="mainImageFile"
            name="mainImageFile"
            onChange={handleMainImageChange}
            className="file-input"
            accept="image/*"
            required
          />
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="Preview" className="image-preview" />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="mb-4">
            <label className="block text-grey-700 font-medium mb-2" htmlFor="startDate">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-grey-700 font-medium mb-2" htmlFor="endDate">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-grey-700 font-medium mb-2" htmlFor="scheduleDate">
              Schedule Date
            </label>
            <input
              type="date"
              id="scheduleDate"
              name="scheduleDate"
              value={formData.scheduleDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-grey-700 font-medium mb-2" htmlFor="article">
            Author/Article Source
          </label>
          <input
            type="text"
            id="article"
            name="article"
            value={formData.article}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-grey-700 font-medium mb-2" htmlFor="contentFiles">
            Additional Content Images
          </label>
          <input
            type="file"
            id="contentFiles"
            name="contentFiles"
            onChange={handleContentFilesChange}
            className="file-input"
            accept="image/*"
            multiple
          />
          <p className="text-sm text-grey-600 mt-1">
            You can select multiple images that will be available for use in your content
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-grey-700 font-medium mb-2" htmlFor="htmlContent">
            Blog Content
          </label>
          <div className="flex flex-col">
            <textarea
              id="htmlContent"
              name="htmlContent"
              value={formData.htmlContent}
              onChange={handleChange}
              onPaste={handlePaste}
              className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-64 font-mono"
              placeholder={`Paste your blog content here... Use the buttons above to format your text.\n\nExample structure:\n<div>\n<h2>Main Heading</h2>\n<p><strong>Important text</strong> content here...</p>\n<br/>\n<h3>Sub Heading</h3>\n<p>Content here...</p>\n<ul>\n<li>List item 1</li>\n<li>List item 2</li>\n</ul>\n</div>`}
            />
            <p className="text-sm text-grey-600 mt-1">
              Note: Use H2 for main headings and H3 for sub-headings. Use Bold for important text.
            </p>
          </div>
        </div>

        {/* Live HTML Preview */}
        {formData.htmlContent && (
          <div className="mb-6 p-4 border border-grey-300 rounded-md">
            <h3 className="text-lg font-medium mb-3">Content Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* HTML Code Preview */}
              <div>
                <h4 className="text-md font-medium mb-2">HTML Code:</h4>
                <pre className="p-4 bg-grey-800 text-green-400 rounded-md overflow-x-auto text-sm h-[500px] overflow-y-auto font-mono">
                  {formData.htmlContent}
                </pre>
              </div>
              
              {/* Rendered Preview with Formatting Buttons */}
              <div>
                <h4 className="text-md font-medium mb-2">Rendered Preview:</h4>
                <div className="flex flex-col h-[500px]">
                  {/* Formatting Buttons */}
                  <div className="mb-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={formatHeading}
                      className="bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 transition"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={formatStrong}
                      className="bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 transition"
                    >
                      Bold
                    </button>
                    <button
                      type="button"
                      onClick={formatItalic}
                      className="bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 transition"
                    >
                      Italic
                    </button>
                    <button
                      type="button"
                      onClick={formatParagraph}
                      className="bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 transition"
                    >
                      Paragraph
                    </button>
                    <button
                      type="button"
                      onClick={formatList}
                      className="bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 transition"
                    >
                      List Item
                    </button>
                    <button
                      type="button"
                      onClick={insertLineBreak}
                      className="bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 transition"
                    >
                      Line Break
                    </button>
                    <button
                      type="button"
                      onClick={handleImageInsert}
                      className="bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 transition"
                    >
                      Image
                    </button>
                  </div>
                  
                  {/* Editable Preview */}
                  <div 
                    id="rendered-preview"
                    className="p-4 bg-white border border-grey-300 rounded-md overflow-x-auto flex-grow overflow-y-auto"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={handlePreviewChange}
                    onBlur={handlePreviewChange}
                    dangerouslySetInnerHTML={{ 
                      __html: previewContent || cleanHtml(formData.htmlContent)
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {responseData && (
          <div className="mb-6 p-4 border border-grey-300 rounded-md bg-green-50">
            <h3 className="text-lg font-medium mb-3">Upload Successful!</h3>
            <div>
              <h4 className="text-md font-medium mb-2">Blog Details:</h4>
              <p><strong>Blog ID:</strong> {responseData.blog?.id}</p>
              <p><strong>Title:</strong> {responseData.blog?.mainHeading}</p>
              {responseData.blog?.mainImageUrl && (
                <p><strong>Main Image URL:</strong> {responseData.blog?.mainImageUrl}</p>
              )}
              {responseData.images && responseData.images.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-md font-medium mb-2">Uploaded Content Images:</h4>
                  <ul className="list-disc pl-5">
                    {responseData.images.map((img, index) => (
                      <li key={index}>{img.contentUrl}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="bg-grey-500 text-white py-2 px-4 rounded hover:bg-grey-600 transition"
            >
              Reset Form
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`${
              isSubmitting ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
            } text-white py-2 px-6 rounded transition`}
          >
            {isSubmitting ? "Uploading..." : "Upload Blog"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogUpload;