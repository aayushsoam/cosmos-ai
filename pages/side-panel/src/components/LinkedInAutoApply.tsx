/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import './LinkedInAutoApply.css';

interface LinkedInAutoApplyProps {
  onClose: () => void;
  onSendMessage: (text: string, displayText?: string) => void;
}

const LinkedInAutoApply: React.FC<LinkedInAutoApplyProps> = ({ onClose, onSendMessage }) => {
  // --- State ---
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [location, setLocation] = useState('India');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [easyApplyOnly, setEasyApplyOnly] = useState(true);
  const [datePeriod, setDatePeriod] = useState('Past week');
  const [maxApply, setMaxApply] = useState(10);
  const [isDispatching, setIsDispatching] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Extract text from uploaded file ---
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        // For PDF: basic text extraction (works for text-based PDFs)
        // For DOC/DOCX: raw text
        resolve(text || `[Resume: ${file.name}]`);
      };
      reader.onerror = () => resolve(`[Resume: ${file.name}]`);
      reader.readAsText(file);
    });
  };

  // --- Handlers ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      const text = await extractTextFromFile(file);
      setResumeText(text);
    }
  };

  const handleAddSearchTerm = () => {
    const term = searchInput.trim();
    if (term && !searchTerms.includes(term)) {
      setSearchTerms(prev => [...prev, term]);
      setSearchInput('');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSearchTerm();
    }
  };

  const handleRemoveSearchTerm = (term: string) => {
    setSearchTerms(prev => prev.filter(t => t !== term));
  };

  // --- Build and dispatch the agent task ---
  const handleStartApply = () => {
    if (searchTerms.length === 0) {
      alert('Please add at least one search term!');
      return;
    }

    setIsDispatching(true);

    // Build the agent task prompt
    const searchTermsList = searchTerms.map(t => `"${t}"`).join(', ');

    const filters: string[] = [];
    if (easyApplyOnly) filters.push('- Enable "Easy Apply" filter');
    if (datePeriod) filters.push(`- Set date posted to "${datePeriod}"`);
    if (experienceLevel) filters.push(`- Set experience level to "${experienceLevel}"`);

    const taskPrompt = `You are a LinkedIn Auto Job Applier. Your task is to automatically apply for jobs on LinkedIn.

INSTRUCTIONS:
1. Navigate to https://www.linkedin.com/jobs/
2. In the job search box, search for: ${searchTermsList}
3. Set location to: "${location}"
4. Apply these filters:
${filters.join('\n')}
5. For each job that appears in results:
   a. Click on the job listing to view details
   b. If there is an "Easy Apply" button, click it
   c. Fill all required form fields using the resume data provided below
   d. If there are multiple steps in the application, click "Next" and fill each step
   e. Review and submit the application
   f. Close the application dialog and move to the next job
   g. If a field asks for information not in the resume, use reasonable defaults
6. Apply to a maximum of ${maxApply} jobs
7. Skip jobs if:
   - You've already applied to them (shows "Applied" badge)
   - The application requires external redirect (not Easy Apply)
   - The form requires uploading documents you cannot provide
8. After completing, report which jobs you applied to (job title + company name)

${resumeText ? `RESUME DATA (use this to fill application forms):\n${resumeText}` : 'NOTE: No resume uploaded. Fill forms with generally appropriate information and skip resume upload fields if encountered.'}

IMPORTANT TIPS:
- Wait for page elements to load before clicking
- If a modal or popup appears, handle it appropriately
- Use scroll if needed to find buttons or form fields
- Be careful with dropdown selections - pick the closest matching option
- If you encounter a CAPTCHA or login wall, report it and stop`;

    // Display text shown in chat (shorter)
    const displayText = `🔗 LinkedIn Auto Apply: Searching for ${searchTermsList} in ${location} (max ${maxApply} jobs)`;

    // Dispatch task via the agent
    onSendMessage(taskPrompt, displayText);

    // Close the panel and let the agent take over
    setTimeout(() => {
      setIsDispatching(false);
      onClose();
    }, 500);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // --- Render ---
  return (
    <div className="linkedin-panel">
      {/* Header */}
      <div className="linkedin-panel__header">
        <div className="linkedin-panel__title">
          <span className="linkedin-panel__title-icon">in</span>
          LinkedIn Auto Apply
        </div>
        <button className="linkedin-panel__close-btn" onClick={onClose} title="Close">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="linkedin-panel__content">
        {/* Resume Upload */}
        <div className="linkedin-section">
          <div className="linkedin-section__title">
            <span className="linkedin-section__title-icon">📄</span>
            Resume (Optional)
          </div>
          <div className="linkedin-resume-upload">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
            />
            {!resumeFile ? (
              <div className="linkedin-resume-dropzone" onClick={() => fileInputRef.current?.click()}>
                <div className="linkedin-resume-dropzone__icon">📎</div>
                <div className="linkedin-resume-dropzone__text">
                  <strong>Click to upload</strong> your resume (PDF, DOC, TXT)
                </div>
              </div>
            ) : (
              <div className="linkedin-resume-file">
                <span className="linkedin-resume-file__icon">📄</span>
                <div className="linkedin-resume-file__info">
                  <div className="linkedin-resume-file__name">{resumeFile.name}</div>
                  <div className="linkedin-resume-file__size">{formatFileSize(resumeFile.size)}</div>
                </div>
                <button
                  className="linkedin-resume-file__remove"
                  onClick={() => {
                    setResumeFile(null);
                    setResumeText('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}>
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Job Preferences */}
        <div className="linkedin-section">
          <div className="linkedin-section__title">
            <span className="linkedin-section__title-icon">🔍</span>
            Job Preferences
          </div>

          {/* Search Terms */}
          <div className="linkedin-form-group">
            <label className="linkedin-form-label">Search Terms *</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                className="linkedin-form-input"
                placeholder="e.g. Software Engineer"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <button
                className="linkedin-export-btn"
                onClick={handleAddSearchTerm}
                style={{ whiteSpace: 'nowrap', padding: '10px 14px' }}>
                + Add
              </button>
            </div>
            {searchTerms.length > 0 && (
              <div className="linkedin-tags">
                {searchTerms.map(term => (
                  <span key={term} className="linkedin-tag">
                    {term}
                    <button className="linkedin-tag__remove" onClick={() => handleRemoveSearchTerm(term)}>
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="linkedin-form-group">
            <label className="linkedin-form-label">Location</label>
            <input
              type="text"
              className="linkedin-form-input"
              placeholder="e.g. India, United States"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          {/* Experience Level */}
          <div className="linkedin-form-group">
            <label className="linkedin-form-label">Experience Level</label>
            <select
              className="linkedin-form-select"
              value={experienceLevel}
              onChange={e => setExperienceLevel(e.target.value)}>
              <option value="">All Levels</option>
              <option value="Internship">Internship</option>
              <option value="Entry level">Entry Level</option>
              <option value="Associate">Associate</option>
              <option value="Mid-Senior level">Mid-Senior Level</option>
              <option value="Director">Director</option>
              <option value="Executive">Executive</option>
            </select>
          </div>

          {/* Date Posted */}
          <div className="linkedin-form-group">
            <label className="linkedin-form-label">Date Posted</label>
            <select className="linkedin-form-select" value={datePeriod} onChange={e => setDatePeriod(e.target.value)}>
              <option value="">Any Time</option>
              <option value="Past 24 hours">Past 24 Hours</option>
              <option value="Past week">Past Week</option>
              <option value="Past month">Past Month</option>
            </select>
          </div>

          {/* Max Applications */}
          <div className="linkedin-form-group">
            <label className="linkedin-form-label">Max Applications</label>
            <input
              type="number"
              className="linkedin-form-input"
              min={1}
              max={50}
              value={maxApply}
              onChange={e => setMaxApply(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
            />
          </div>

          {/* Easy Apply Toggle */}
          <div className="linkedin-toggle-row">
            <span className="linkedin-toggle-label">Easy Apply Only</span>
            <label className="linkedin-toggle">
              <input type="checkbox" checked={easyApplyOnly} onChange={e => setEasyApplyOnly(e.target.checked)} />
              <span className="linkedin-toggle__slider" />
            </label>
          </div>
        </div>

        {/* Start Button */}
        <button
          className="linkedin-start-btn"
          onClick={handleStartApply}
          disabled={isDispatching || searchTerms.length === 0}>
          {isDispatching ? <>⏳ Starting Agent...</> : <>🚀 Start Auto Apply</>}
        </button>

        {/* Info */}
        <div className="linkedin-status linkedin-status--idle">
          <span className="linkedin-status__dot" />
          <span>
            The Cosmos AI agent will navigate LinkedIn and apply to jobs using your browser. Make sure you're logged
            into LinkedIn before starting.
          </span>
        </div>
      </div>
    </div>
  );
};

export default LinkedInAutoApply;
