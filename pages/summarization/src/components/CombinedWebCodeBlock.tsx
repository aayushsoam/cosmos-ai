import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Pencil, Play, Maximize, ArrowLeft, Loader2 } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import { PreviewBox } from './PreviewBox';

export const CombinedWebCodeBlock = ({
  html: initialHtml,
  css: initialCss,
  js: initialJs,
}: {
  html: string;
  css: string;
  js: string;
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [editableHtml, setEditableHtml] = useState(initialHtml);
  const [editableCss, setEditableCss] = useState(initialCss);
  const [editableJs, setEditableJs] = useState(initialJs);
  const [isEditing, setIsEditing] = useState(false);

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'html':
        return editableHtml;
      case 'css':
        return editableCss;
      case 'js':
        return editableJs;
      default:
        return '';
    }
  };

  const setCurrentCode = (code: string) => {
    switch (activeTab) {
      case 'html':
        setEditableHtml(code);
        break;
      case 'css':
        setEditableCss(code);
        break;
      case 'js':
        setEditableJs(code);
        break;
    }
  };

  const runCombinedCode = () => {
    setIsExecuting(true);
    setShowPreview(true);
    setTimeout(() => setIsExecuting(false), 500);
  };

  return (
    <div className="relative my-4 w-full max-w-4xl mx-auto rounded-[20px] overflow-hidden border border-gray-700 bg-[#0d0d0d]">
      <div className="sticky top-0 flex items-center border-b border-gray-700 justify-between bg-gray-900 px-4 py-2 text-xs text-gray-200 z-10">
        <div className="flex items-center gap-4">
          <span className="text-green-400 font-semibold hidden sm:inline">🌐 Web Project</span>
          <div className="flex gap-1">
            {initialHtml && (
              <button
                onClick={() => setActiveTab('html')}
                className={`px-2 py-1 rounded text-xs ${activeTab === 'html' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                HTML
              </button>
            )}
            {initialCss && (
              <button
                onClick={() => setActiveTab('css')}
                className={`px-2 py-1 rounded text-xs ${activeTab === 'css' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                CSS
              </button>
            )}
            {initialJs && (
              <button
                onClick={() => setActiveTab('js')}
                className={`px-2 py-1 rounded text-xs ${activeTab === 'js' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                JS
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditing(!isEditing)} className="h-7 px-2 text-xs gap-1" variant="ghost">
            <Pencil size={12} /> {isEditing ? 'Save' : 'Edit'}
          </Button>
          <Button
            onClick={runCombinedCode}
            disabled={isExecuting}
            className="h-7 px-2 text-xs gap-1 bg-green-700/20 text-green-400">
            {isExecuting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Run All
          </Button>
        </div>
      </div>

      {!showPreview ? (
        <div className="transition-all duration-300">
          <div className="overflow-y-auto">
            {isEditing ? (
              <div className="h-72">
                <MonacoEditor
                  height="100%"
                  language={activeTab === 'js' ? 'javascript' : activeTab}
                  theme="vs-dark"
                  value={getCurrentCode()}
                  onChange={value => setCurrentCode(value || '')}
                  options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                />
              </div>
            ) : (
              <pre className="p-0 bg-gray-950 text-white overflow-x-auto text-sm leading-relaxed scrollbar-thin scrollbar-thumb-gray-700">
                <code className={`language-${activeTab === 'js' ? 'javascript' : activeTab} p-4 block`}>
                  {getCurrentCode()}
                </code>
              </pre>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-950 text-white transition-all duration-300">
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-4 py-2 text-xs flex justify-between z-10">
            <span className="text-green-400">Preview</span>
            <Button onClick={() => setShowPreview(false)} className="h-6 px-2 text-xs flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Code
            </Button>
          </div>
          <div className="bg-white">
            <PreviewBox html={editableHtml} css={editableCss} js={editableJs} searchQuery="" />
          </div>
        </div>
      )}
    </div>
  );
};
