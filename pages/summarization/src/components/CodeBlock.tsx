import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Pencil, Play, Maximize, ArrowLeft, Loader2, Copy, X } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { PreviewBox } from './PreviewBox';

export const CodeBlock = ({ code: initialCode, language }: { code: string; language: string }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isOutputVisible, setIsOutputVisible] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState({ html: '', css: '', js: '' });
  const [code, setCode] = useState(initialCode);
  const [isEditing, setIsEditing] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const [fileName, setFileName] = useState(`code.${language || 'js'}`);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [compilationProgress, setCompilationProgress] = useState<string>('');

  useEffect(() => {
    if (!isEditing && codeRef.current) {
      setTimeout(() => {
        if (codeRef.current) hljs.highlightElement(codeRef.current);
      }, 50);
    }
  }, [isEditing, code]);

  const runCode = async () => {
    setIsExecuting(true);
    setIsOutputVisible(true);
    try {
      const detectedLanguage = language || 'javascript';
      if (['html', 'css', 'javascript'].includes(detectedLanguage)) {
        setPreviewContent({
          html: detectedLanguage === 'html' ? code : '',
          css: detectedLanguage === 'css' ? code : '',
          js: detectedLanguage === 'javascript' ? code : '',
        });
        setShowPreview(true);
      } else {
        setOutput('Execution not fully implemented in this demo.');
      }
    } catch (error) {
      setOutput(`Error: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const compileLatex = async () => {
    setIsExecuting(true);
    setCompilationError(null);
    setPdfPreviewUrl(null);
    setCompilationProgress('Initializing...');

    try {
      if (!code.includes('\\documentclass')) {
        setCompilationError('Content does not look like LaTeX. Please include \\documentclass.');
        setIsExecuting(false);
        setCompilationProgress('');
        return;
      }

      const codeSize = new Blob([code]).size;
      const needsXelatex = code.includes('\\usepackage{fontspec}');
      const engine = needsXelatex ? 'xelatex' : 'pdflatex';

      // For very large documents, warn user
      if (codeSize > 500000) {
        // 500KB
        setCompilationProgress(
          `Compiling large document (${Math.round(codeSize / 1024)}KB)... This may take up to 60 seconds...`,
        );
      } else {
        setCompilationProgress('Compiling...');
      }

      // Try latexonline.cc with extended timeout for large files
      let success = false;
      const controller = new AbortController();
      const timeout = codeSize > 100000 ? 90000 : 45000; // Extended timeout for large files

      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const formData = new FormData();
        formData.append('text', code);

        const response = await fetch(`https://latexonline.cc/compile?command=${engine}`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const blob = await response.blob();

          // Check if we got a PDF
          if (blob.type === 'application/pdf' || (blob.type === 'application/octet-stream' && blob.size > 5000)) {
            setPdfPreviewUrl(URL.createObjectURL(blob));
            success = true;
          } else {
            // We got something else (probably compilation log or error)
            const text = await blob.text();

            // Check if it looks like a compilation log
            if (text.includes('This is') && text.includes('TeX')) {
              throw new Error(
                `Server returned compilation log instead of PDF. The LaTeX code may have errors. Log snippet: ${text.substring(0, 500)}...`,
              );
            } else {
              throw new Error(`Invalid response from server (${blob.type}, ${blob.size} bytes)`);
            }
          }
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          setCompilationProgress('First service timed out, trying backup...');
        } else {
          console.warn('latexonline.cc failed:', err);
          setCompilationProgress('Primary service failed, trying backup...');
        }
      }

      // If first service failed, try texlive.net
      if (!success) {
        // Split large documents into manageable chunks if needed
        if (codeSize > 200000) {
          setCompilationError(
            `Document is too large (${Math.round(codeSize / 1024)}KB) for online compilation. Please use the Editor view to download the .tex file and compile locally using TeXLive or MiKTeX.`,
          );
          return;
        }

        try {
          const fd = new FormData();
          fd.append('filecontents[]', code);
          fd.append('filename[]', 'document.tex');
          fd.append('engine', engine);
          fd.append('return', 'pdf');

          const r = await fetch('https://texlive.net/cgi-bin/latexcgi', {
            method: 'POST',
            body: fd,
          });

          if (r.ok) {
            const blob = await r.blob();
            setPdfPreviewUrl(URL.createObjectURL(blob));
            success = true;
          } else {
            throw new Error(`Server returned ${r.status}`);
          }
        } catch (err) {
          console.error('texlive.net also failed:', err);
        }
      }

      if (!success) {
        setCompilationError(
          `Compilation failed. For large or complex documents (${Math.round(codeSize / 1024)}KB), please download the .tex file from the Editor view and compile locally using TeXLive, MiKTeX, or Overleaf.`,
        );
      }
    } catch (error: any) {
      console.error('LaTeX compilation error:', error);
      setCompilationError(error.message || 'Compilation failed. Try downloading the .tex file and compiling locally.');
    } finally {
      setIsExecuting(false);
      setCompilationProgress('');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="relative my-4 w-full max-w-4xl mx-auto rounded-[20px] overflow-hidden border border-gray-700 bg-[#0d0d0d]">
      {!isOutputVisible ? (
        <div className="transition-all duration-300">
          {/* Header */}
          <div className="sticky top-0 flex items-center border-b border-gray-700 justify-between bg-gray-900 px-4 py-2 text-xs text-gray-200 z-10">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-mono">{fileName}</span>
              {language === 'latex' && (
                <span className="text-gray-600 text-[10px]">{Math.round(new Blob([code]).size / 1024)}KB</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(!isEditing)} className="h-7 px-2 text-xs gap-1" variant="ghost">
                <Pencil size={12} /> {isEditing ? 'Save' : 'Edit'}
              </Button>
              <Button onClick={copyToClipboard} className="h-7 px-2 text-xs gap-1" variant="ghost">
                <Copy size={12} /> Copy
              </Button>
              {['html', 'css', 'javascript'].includes(language) && (
                <Button
                  onClick={runCode}
                  disabled={isExecuting}
                  className="h-7 px-2 text-xs gap-1 bg-green-700/20 text-green-400 hover:bg-green-700/40">
                  <Play size={12} /> Run
                </Button>
              )}
              {language === 'latex' && (
                <Button
                  onClick={compileLatex}
                  disabled={isExecuting}
                  className="h-7 px-2 text-xs gap-1 bg-blue-700/20 text-blue-400 hover:bg-blue-700/40">
                  {isExecuting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}{' '}
                  {isExecuting ? 'Compiling...' : 'Compile PDF'}
                </Button>
              )}
            </div>
          </div>

          {/* Compilation Progress */}
          {compilationProgress && (
            <div className="bg-blue-950/30 border-b border-blue-900/50 px-4 py-2 text-xs text-blue-300">
              {compilationProgress}
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[500px]">
            {isEditing ? (
              <div className="h-72">
                <MonacoEditor
                  height="100%"
                  language={language || 'javascript'}
                  theme="vs-dark"
                  value={code}
                  onChange={value => setCode(value || '')}
                  options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                />
              </div>
            ) : (
              <pre className="p-0 bg-[#0d0d0d] text-white overflow-x-auto text-sm leading-relaxed scrollbar-thin scrollbar-thumb-gray-700">
                <code ref={codeRef} className={`language-${language || 'plaintext'} p-4 block font-mono`}>
                  {code}
                </code>
              </pre>
            )}
          </div>

          {/* Inline PDF Preview */}
          {pdfPreviewUrl && (
            <div className="border-t border-gray-700">
              <div className="bg-gray-900 px-4 py-2 text-xs flex justify-between items-center">
                <span className="text-gray-300">PDF Preview</span>
                <div className="flex gap-2">
                  <a href={pdfPreviewUrl} download="document.pdf" className="text-blue-400 hover:underline">
                    Download PDF
                  </a>
                  <a href={pdfPreviewUrl} target="_blank" className="text-blue-400 hover:underline">
                    Open in New Tab
                  </a>
                  <Button onClick={() => setPdfPreviewUrl(null)} variant="ghost" className="h-6 px-2 text-xs">
                    <X size={12} /> Close
                  </Button>
                </div>
              </div>
              <iframe src={pdfPreviewUrl} className="w-full h-[600px] bg-white" title="PDF Preview" />
            </div>
          )}

          {/* Compilation Error */}
          {compilationError && (
            <div className="border-t border-red-900/50 bg-red-950/30 px-4 py-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-red-400 text-sm font-semibold mb-1">Compilation Failed</p>
                  <p className="text-red-300 text-xs mb-2">{compilationError}</p>
                  <p className="text-gray-400 text-[11px]">
                    💡 For large documents, switch to the <strong>Editor</strong> view and use "Download .tex" to
                    compile locally.
                  </p>
                </div>
                <Button
                  onClick={() => setCompilationError(null)}
                  variant="ghost"
                  className="h-6 px-2 text-xs text-red-400">
                  <X size={12} />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-950 text-white transition-all duration-300">
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-4 py-2 text-xs flex justify-between z-10">
            <span>Output</span>
            <Button onClick={() => setIsOutputVisible(false)} className="h-6 px-2 text-xs flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Code
            </Button>
          </div>
          {showPreview ? (
            <div className="bg-white">
              <PreviewBox html={previewContent.html} css={previewContent.css} js={previewContent.js} searchQuery="" />
            </div>
          ) : (
            <pre className="p-4 whitespace-pre-wrap text-sm font-mono text-gray-300">{output}</pre>
          )}
        </div>
      )}
    </div>
  );
};
