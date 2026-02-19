import React, { useEffect, useState, useRef } from 'react';
import { AIService, DocumentKind } from './services/aiService';
// @ts-ignore
import MindMap from './components/MindMap';
import NodeInteractionModal from './components/NodeInteractionModal';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import ChatMessage, { Message } from './components/ChatMessage';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StopCircle, Send, Paperclip, Share2, Plus, X, Globe } from 'lucide-react';
import 'highlight.js/styles/atom-one-dark.css';
import './SummarizationPage.css';

// Configure Monaco loader
loader.config({ monaco: monaco as any });

interface FooterTab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

const SummarizationPage: React.FC = () => {
  // --- State ---
  const [taskText, setTaskText] = useState<string>('');
  const [finalResult, setFinalResult] = useState<string>(''); // For Editor content
  const [messages, setMessages] = useState<Message[]>([]);
  const [transforming, setTransforming] = useState(false);
  const [latexCode, setLatexCode] = useState<string>('');
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'editor' | 'map'>('chat');

  // Input State
  const [input, setInput] = useState('');
  const [availableTabs, setAvailableTabs] = useState<FooterTab[]>([]);
  const [selectedTabs, setSelectedTabs] = useState<FooterTab[]>([]);
  const [showTabPicker, setShowTabPicker] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const tabPickerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    // Load initial state
    const load = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const taskTextParam = urlParams.get('task');

      if (taskTextParam) {
        setTaskText(taskTextParam);
        const initialMsg: Message = {
          id: `user-init`,
          role: 'user',
          content: taskTextParam,
          timestamp: Date.now(),
        };
        const storage = await chrome.storage.local.get(['chatMessages']);
        if (!storage.chatMessages || storage.chatMessages.length === 0) {
          setMessages([initialMsg]);
        } else {
          setMessages(storage.chatMessages);
        }
      } else {
        chrome.storage.local.get(['summarizationTask', 'chatMessages'], result => {
          if (result.summarizationTask) setTaskText(result.summarizationTask);
          if (result.chatMessages) setMessages(result.chatMessages);
        });
      }
    };
    load();
  }, []);

  // Fetch available tabs
  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const tabs = await chrome.tabs.query({});
        const tabList: FooterTab[] = tabs
          .filter(t => t.id && t.url && !t.url.startsWith('chrome://'))
          .map(t => ({
            id: t.id!,
            title: t.title || 'Untitled',
            url: t.url!,
            favIconUrl: t.favIconUrl,
          }));
        setAvailableTabs(tabList);
      } catch (e) {
        console.error('Failed to fetch tabs:', e);
      }
    };
    fetchTabs();
  }, []);

  // Close tab picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tabPickerRef.current && !tabPickerRef.current.contains(e.target as Node)) {
        setShowTabPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Persist messages
    if (messages.length > 0) {
      chrome.storage.local.set({ chatMessages: messages });
    }

    // Auto scroll to bottom
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      const target = scrollContainer || scrollAreaRef.current;
      target.scrollTop = target.scrollHeight;
    }
  }, [messages]);

  // Fetch content from a tab
  const fetchTabContent = async (tabId: number): Promise<string> => {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => document.body.innerText || document.body.textContent || '',
      });
      if (results && results[0]?.result) {
        // Limit content to avoid token overflow
        const text = results[0].result as string;
        return text.substring(0, 8000);
      }
    } catch (e) {
      console.error(`Failed to get content from tab ${tabId}:`, e);
    }
    return '';
  };

  // --- Handlers ---
  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text && selectedTabs.length === 0) return;

    setInput(''); // Clear input immediately
    setTransforming(true);

    // Build display message
    const tabNames = selectedTabs.map(t => t.title).join(', ');
    const displayContent = selectedTabs.length > 0 ? `${text || 'Process these tabs'}\n\n📑 Tabs: ${tabNames}` : text;

    // 1. Add User Message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: displayContent,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Fetch content from selected tabs
      let tabContents = '';
      if (selectedTabs.length > 0) {
        const contents = await Promise.all(
          selectedTabs.map(async tab => {
            const content = await fetchTabContent(tab.id);
            return content ? `--- Content from "${tab.title}" (${tab.url}) ---\n${content}` : '';
          }),
        );
        tabContents = contents.filter(Boolean).join('\n\n');
      }

      // Combine: tab contents + any existing context + user message
      const fullContext = [tabContents, finalResult || taskText, text].filter(Boolean).join('\n\n');

      // Determine kind based on input keywords
      let kind: DocumentKind = 'summary';
      const lowerText = text.toLowerCase();
      if (
        lowerText.includes('mind map') ||
        lowerText.includes('mindmap') ||
        lowerText.includes('diagram') ||
        lowerText.includes('structure')
      ) {
        kind = 'map';
      } else if (lowerText.includes('latex') || lowerText.includes('tex')) {
        kind = 'latex';
      } else if (lowerText.includes('research paper') || lowerText.includes('academic')) {
        kind = 'research_paper';
      }

      const response = await AIService.generateDocument(
        kind,
        fullContext,
        text || 'Summarize and analyze the provided content',
      );

      // 2. Add AI Response
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);

      if (response.length > 50) {
        setFinalResult(response);
      }
      if (response.includes('```latex') || response.includes('\\documentclass')) {
        setLatexCode(response);
      }

      // Improve JSON detection and parsing
      if (
        kind === 'map' ||
        response.includes('```json') ||
        response.includes('"root":') ||
        response.includes('"id":')
      ) {
        try {
          // Try to find JSON within code blocks first
          let jsonString = '';
          const codeBlockMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch) {
            jsonString = codeBlockMatch[1];
          } else {
            // Fallback: find first outer curly brace pair
            const braceMatch = response.match(/\{[\s\S]*\}/);
            if (braceMatch) jsonString = braceMatch[0];
          }

          if (jsonString) {
            const mapData = JSON.parse(jsonString);
            if (mapData.id === 'root' || mapData.root) {
              const root = mapData.root ? mapData.root : mapData;
              setMindMapData(root);
              setMessages(prev => [
                ...prev,
                {
                  id: `system-${Date.now()}`,
                  role: 'system',
                  content: `Map generated successfully! Switching to map view...`,
                  timestamp: Date.now(),
                },
              ]);
              setViewMode('map'); // Auto-switch to map view
            }
          }
        } catch (e) {
          console.error('JSON Parse Error:', e);
        }
      }

      // Clear selected tabs after sending
      setSelectedTabs([]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${error.message || 'Failed to generate response'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setTransforming(false);
    }
  };

  const handleCompileLatex = async () => {
    if (!latexCode && !finalResult) {
      alert('No content to compile!');
      return;
    }
    const codeToCompile = latexCode || finalResult;

    if (!codeToCompile.includes('\\documentclass')) {
      alert('Content does not look like LaTeX. Please generate a LaTeX document first.');
      return;
    }

    setTransforming(true);
    try {
      const needsXelatex = codeToCompile.includes('\\usepackage{fontspec}');
      const engine = needsXelatex ? 'xelatex' : 'pdflatex';

      const formData = new FormData();
      formData.append('text', codeToCompile);
      const response = await fetch(`https://latexonline.cc/compile?command=${engine}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        setPdfPreviewUrl(URL.createObjectURL(blob));
        setViewMode('editor');
      } else {
        const fd = new FormData();
        fd.append('filecontents[]', codeToCompile);
        fd.append('filename[]', 'document.tex');
        fd.append('engine', engine);
        fd.append('return', 'pdf');
        const r = await fetch('https://texlive.net/cgi-bin/latexcgi', { method: 'POST', body: fd });
        if (!r.ok) throw new Error('TeXLive Error');
        setPdfPreviewUrl(URL.createObjectURL(await r.blob()));
        setViewMode('editor');
      }
    } catch (e) {
      console.error(e);
      alert('Error compiling PDF. Please check the LaTeX code.');
    } finally {
      setTransforming(false);
    }
  };

  // Wrapper for code blocks to compile LaTeX
  const handleCompileLatexFromCodeBlock = async (code: string) => {
    setLatexCode(code);
    setFinalResult(code);

    if (!code.includes('\\documentclass')) {
      alert('Content does not look like LaTeX. Please generate a LaTeX document first.');
      return;
    }

    setTransforming(true);
    try {
      const needsXelatex = code.includes('\\usepackage{fontspec}');
      const engine = needsXelatex ? 'xelatex' : 'pdflatex';

      const formData = new FormData();
      formData.append('text', code);
      const response = await fetch(`https://latexonline.cc/compile?command=${engine}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        setPdfPreviewUrl(URL.createObjectURL(blob));
        setViewMode('editor');
      } else {
        const fd = new FormData();
        fd.append('filecontents[]', code);
        fd.append('filename[]', 'document.tex');
        fd.append('engine', engine);
        fd.append('return', 'pdf');
        const r = await fetch('https://texlive.net/cgi-bin/latexcgi', { method: 'POST', body: fd });
        if (!r.ok) throw new Error('TeXLive Error');
        setPdfPreviewUrl(URL.createObjectURL(await r.blob()));
        setViewMode('editor');
      }
    } catch (e) {
      console.error(e);
      alert('Error compiling PDF. Please check the LaTeX code.');
    } finally {
      setTransforming(false);
    }
  };

  // Mind Map Handlers
  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    setShowModal(true);
  };
  const handleGetAIAnswer = async (topic: string) => {
    return await AIService.getAnswerForTopic(topic, selectedNode?.content || '');
  };
  const handleExplorePath = async (topic: string, prompt: string) => {
    await AIService.explorePath(topic, prompt, selectedNode?.content || '');
  };

  // --- Render Helpers ---

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
      <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center">
        <img src={chrome.runtime.getURL('side-panel/icons/cosmos-logo.png')} className="w-10 h-10 opacity-50" />
      </div>
      <p className="font-medium text-lg">How can I help you today?</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setInput('Summarize this page');
            handleSendMessage();
          }}>
          Summarize Page
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setInput('Create a study plan');
            handleSendMessage();
          }}>
          Study Plan
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0B0D0E] text-gray-300 font-sans overflow-hidden">
      {/* Main Content Area - Full Width */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header - Minimal */}
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0B0D0E] z-20">
          <div className="flex items-center gap-2">
            <img src={chrome.runtime.getURL('side-panel/icons/cosmos-logo.png')} className="w-6 h-6" />
            <span className="font-bold text-white text-lg tracking-tight">Cosmos</span>
          </div>

          {/* View Toggles - Center/Right */}
          <div className="flex bg-[#1e1e1e] rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('chat')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'chat' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
              Chat
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'editor' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
              Editor
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'map' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
              Map
            </button>
          </div>

          <div className="w-[80px]">{/* Spacer or minimal Right Side */}</div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {/* View: Chat */}
          <div className={`${viewMode === 'chat' ? 'flex' : 'hidden'} flex-col h-full`}>
            <ScrollArea className="flex-1 px-4 py-6" ref={scrollAreaRef}>
              <div className="max-w-3xl mx-auto space-y-6 pb-4">
                {messages.length === 0 && renderEmptyState()}
                {messages.map((msg, idx) => (
                  <ChatMessage key={msg.id || idx} message={msg} />
                ))}
                {transforming && (
                  <div className="flex items-center gap-2 text-gray-500 pl-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Thinking...
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area (Fixed Bottom) */}
            <div className="bg-[#0B0D0E] p-4 pb-6">
              <div className="max-w-3xl mx-auto">
                {/* Selected Tabs Display */}
                {selectedTabs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 px-1">
                    {selectedTabs.map(tab => (
                      <div
                        key={tab.id}
                        className="flex items-center gap-1.5 bg-[#2a2a2a] border border-gray-600 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 group hover:border-red-500/50 transition-colors">
                        {tab.favIconUrl ? (
                          <img
                            src={tab.favIconUrl}
                            className="w-3.5 h-3.5 rounded-sm"
                            onError={e => (e.currentTarget.style.display = 'none')}
                          />
                        ) : (
                          <Globe size={12} className="text-gray-500" />
                        )}
                        <span className="max-w-[150px] truncate">{tab.title}</span>
                        <button
                          onClick={() => setSelectedTabs(prev => prev.filter(t => t.id !== tab.id))}
                          className="text-gray-500 hover:text-red-400 transition-colors ml-0.5">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative bg-[#1e1e1e] rounded-xl border border-gray-700 focus-within:border-gray-500 transition-colors shadow-lg">
                  <textarea
                    className="w-full bg-transparent text-white p-3 pr-24 outline-none resize-none min-h-[50px] max-h-[200px] scrollbar-thin scrollbar-thumb-gray-600"
                    placeholder={
                      selectedTabs.length > 0 ? 'Add instructions for selected tabs...' : 'Message Cosmos AI...'
                    }
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    style={{ borderRadius: '0.75rem' }}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    {/* Tab Picker Button */}
                    <div className="relative" ref={tabPickerRef}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-full transition-all ${showTabPicker ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setShowTabPicker(!showTabPicker)}
                        title="Select tabs to add context">
                        <Plus size={18} />
                      </Button>

                      {/* Tab Picker Dropdown */}
                      {showTabPicker && (
                        <div className="absolute bottom-full right-0 mb-2 w-[350px] max-h-[300px] bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                          <div className="p-3 border-b border-gray-700">
                            <p className="text-xs text-gray-400 font-medium">Select tabs to add as context</p>
                          </div>
                          <div className="overflow-y-auto max-h-[240px] scrollbar-thin scrollbar-thumb-gray-600">
                            {availableTabs.length === 0 ? (
                              <p className="p-3 text-xs text-gray-500">No tabs found</p>
                            ) : (
                              availableTabs.map(tab => {
                                const isSelected = selectedTabs.some(t => t.id === tab.id);
                                return (
                                  <button
                                    key={tab.id}
                                    onClick={() => {
                                      setSelectedTabs(prev =>
                                        isSelected ? prev.filter(t => t.id !== tab.id) : [...prev, tab],
                                      );
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#252525] ${
                                      isSelected
                                        ? 'bg-blue-500/10 border-l-2 border-blue-500'
                                        : 'border-l-2 border-transparent'
                                    }`}>
                                    {tab.favIconUrl ? (
                                      <img
                                        src={tab.favIconUrl}
                                        className="w-4 h-4 rounded-sm flex-shrink-0"
                                        onError={e => (e.currentTarget.style.display = 'none')}
                                      />
                                    ) : (
                                      <Globe size={14} className="text-gray-500 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className={`text-sm truncate ${isSelected ? 'text-blue-300' : 'text-gray-300'}`}>
                                        {tab.title}
                                      </p>
                                      <p className="text-[10px] text-gray-600 truncate">{tab.url}</p>
                                    </div>
                                    {isSelected && (
                                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                          <path
                                            d="M1 4L3.5 6.5L9 1"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="default"
                      size="icon"
                      className={`h-8 w-8 rounded-lg transition-all ${input.trim() || selectedTabs.length > 0 ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-700 text-gray-400'}`}
                      onClick={handleSendMessage}
                      disabled={(!input.trim() && selectedTabs.length === 0) || transforming}>
                      {transforming ? <StopCircle size={16} /> : <Send size={16} />}
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-gray-600 mt-3">
                Cosmos AI can make mistakes. Check important info.
              </p>
            </div>
          </div>

          {/* View: Editor */}
          <div className={`${viewMode === 'editor' ? 'flex' : 'hidden'} flex-col h-full bg-[#1e1e1e]`}>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                language={latexCode ? 'latex' : 'markdown'}
                theme="vs-dark"
                value={finalResult || taskText}
                onChange={val => {
                  setFinalResult(val || '');
                  if (latexCode && val) setLatexCode(val);
                }}
                options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 20 }, wordWrap: 'on' }}
                loading={
                  <div className="flex items-center justify-center h-full text-gray-500">Initializing Editor...</div>
                }
              />
            </div>
            {/* PDF Preview Split if available */}
            {pdfPreviewUrl && (
              <div className="h-1/2 border-t border-gray-700 flex flex-col">
                <div className="bg-[#252526] px-4 py-1 text-xs text-gray-300 flex justify-between items-center border-b border-[#333]">
                  <span>PDF Preview</span>
                  <a href={pdfPreviewUrl} target="_blank" className="text-blue-400 hover:underline">
                    Open External
                  </a>
                </div>
                <iframe src={pdfPreviewUrl} className="w-full flex-1" />
              </div>
            )}
          </div>

          {/* View: Map */}
          <div className={`${viewMode === 'map' ? 'flex' : 'hidden'} flex-col h-full bg-[#111] overflow-hidden`}>
            {mindMapData ? (
              <MindMap data={mindMapData} onNodeClick={handleNodeClick} selectedNode={selectedNode} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                <Share2 size={48} className="opacity-20" />
                <p>No Mind Map generated yet.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewMode('chat');
                    setInput('Generate a mind map for this topic');
                  }}>
                  Ask Chat to Generate
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Node Interaction Modal */}
      {showModal && selectedNode && (
        <NodeInteractionModal
          nodeLabel={selectedNode.label}
          nodeContent={selectedNode.content}
          onClose={() => {
            setShowModal(false);
            setSelectedNode(null);
          }}
          onGetAIAnswer={handleGetAIAnswer}
          onExplorePath={handleExplorePath}
        />
      )}
    </div>
  );
};

export default SummarizationPage;
