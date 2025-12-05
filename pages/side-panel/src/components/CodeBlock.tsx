import React, { useState, useRef, useEffect } from 'react';
import './CodeBlock.css';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code: initialCode, language }) => {
  const [code, setCode] = useState(initialCode);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState({ html: '', css: '', js: '' });
  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const detectedLanguage = language || detectLanguage(code);

  const isWebLanguage = ['html', 'css', 'javascript', 'js'].includes(detectedLanguage.toLowerCase());

  useEffect(() => {
    if (iframeRef.current && showPreview && isWebLanguage) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        try {
          doc.open();
          if (detectedLanguage === 'html') {
            doc.write(code);
          } else if (detectedLanguage === 'css') {
            doc.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <style>${code}</style>
                </head>
                <body>
                  <div>CSS Preview</div>
                </body>
              </html>
            `);
          } else if (detectedLanguage === 'javascript' || detectedLanguage === 'js') {
            doc.write(`
              <!DOCTYPE html>
              <html>
                <head></head>
                <body>
                  <div id="app"></div>
                  <script>${code}</script>
                </body>
              </html>
            `);
          }
          doc.close();
        } catch (error) {
          console.error('Error rendering preview:', error);
        }
      }
    }
  }, [code, showPreview, detectedLanguage, isWebLanguage]);

  const handleRun = () => {
    if (isWebLanguage) {
      setShowPreview(true);
      setIsExecuting(true);
      // Small delay to ensure iframe is ready
      setTimeout(() => {
        setIsExecuting(false);
      }, 100);
    } else {
      // For non-web languages, show output (can be extended later)
      setOutput('Code execution not available for this language');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <div className="code-block-info">
          <span className="code-language">{detectedLanguage || 'code'}</span>
        </div>
        <div className="code-block-actions">
          {isWebLanguage && (
            <button className="code-action-btn" onClick={handleRun} title="Run code">
              ▶ Run
            </button>
          )}
          <button
            className="code-action-btn"
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'Save' : 'Edit'}>
            {isEditing ? '✓ Save' : '✎ Edit'}
          </button>
          <button className="code-action-btn" onClick={handleCopy} title="Copy code">
            📋 Copy
          </button>
        </div>
      </div>

      {isEditing ? (
        <textarea
          className="code-editor"
          value={code}
          onChange={e => setCode(e.target.value)}
          onBlur={() => setIsEditing(false)}
          spellCheck={false}
        />
      ) : (
        <pre ref={codeRef} className="code-content">
          <code className={`language-${detectedLanguage}`}>{code}</code>
        </pre>
      )}

      {showPreview && isWebLanguage && (
        <div className="code-preview">
          <div className="preview-header">
            <span>Preview</span>
            <button className="preview-close" onClick={() => setShowPreview(false)}>
              ✕
            </button>
          </div>
          <iframe ref={iframeRef} className="preview-iframe" title="Code preview" />
        </div>
      )}

      {output && !isWebLanguage && (
        <div className="code-output">
          <div className="output-header">Output</div>
          <pre className="output-content">{output}</pre>
        </div>
      )}
    </div>
  );
};

const detectLanguage = (code: string): string => {
  if (code.includes('<html>') || code.includes('<body>') || code.includes('<!DOCTYPE')) return 'html';
  if (code.includes('body {') || code.includes('@media') || code.includes('@import')) return 'css';
  if (code.includes('function') || code.includes('const ') || code.includes('let ') || code.includes('var '))
    return 'javascript';
  if (code.includes('def ') || code.includes('print(')) return 'python';
  if (code.includes('int main()') || code.includes('#include')) return 'cpp';
  if (code.includes('public static void main')) return 'java';
  return 'plaintext';
};

export default CodeBlock;
