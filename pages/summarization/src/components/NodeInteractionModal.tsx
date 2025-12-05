import React, { useState } from 'react';
import './NodeInteractionModal.css';

interface NodeInteractionModalProps {
  nodeLabel: string;
  nodeContent: string;
  onClose: () => void;
  onGetAIAnswer: (topic: string) => Promise<string>;
  onExplorePath: (topic: string, prompt: string) => Promise<void>;
}

const NodeInteractionModal: React.FC<NodeInteractionModalProps> = ({
  nodeLabel,
  nodeContent,
  onClose,
  onGetAIAnswer,
  onExplorePath,
}) => {
  const [mode, setMode] = useState<'answer' | 'explore'>('answer');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleGetAnswer = async () => {
    setLoading(true);
    setAiResponse(null);
    try {
      const answer = await onGetAIAnswer(nodeLabel);
      setAiResponse(answer);
      // Auto-close modal after getting answer (answer is already added to mind map)
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error getting AI answer:', error);
      setAiResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExplorePath = async () => {
    if (!customPrompt.trim()) {
      alert('Please enter a prompt');
      return;
    }
    setLoading(true);
    setAiResponse(null);
    try {
      await onExplorePath(nodeLabel, customPrompt);
      // Success - the parent will add the new node
      // Auto-close modal after exploring path (new node is already added to mind map)
      setTimeout(() => {
        onClose();
        setCustomPrompt(''); // Reset prompt
      }, 500);
    } catch (error) {
      console.error('Error exploring path:', error);
      setAiResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{nodeLabel}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="current-content">
            <h3>Current Content:</h3>
            <p>{nodeContent}</p>
          </div>

          <div className="mode-selector">
            <button className={`mode-btn ${mode === 'answer' ? 'active' : ''}`} onClick={() => setMode('answer')}>
              Get AI Answer
            </button>
            <button className={`mode-btn ${mode === 'explore' ? 'active' : ''}`} onClick={() => setMode('explore')}>
              Explore Path
            </button>
          </div>

          {mode === 'answer' ? (
            <div className="answer-mode">
              <p className="mode-description">
                Get an AI-generated detailed answer about this topic. The answer will be automatically added as a
                connected node.
              </p>
              <button className="action-btn primary" onClick={handleGetAnswer} disabled={loading}>
                {loading ? 'Generating Answer...' : 'Get AI Answer'}
              </button>
              {loading && (
                <div className="loading-indicator">
                  <div className="spinner-small"></div>
                  <span>AI is generating answer...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="explore-mode">
              <p className="mode-description">
                Explore a specific aspect of this topic. Enter your question and a new connected node will be created
                automatically.
              </p>
              <textarea
                className="prompt-input"
                placeholder="Enter your question or prompt about this topic..."
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                rows={4}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && customPrompt.trim() && !loading) {
                    e.preventDefault();
                    handleExplorePath();
                  }
                }}
              />
              <button
                className="action-btn primary"
                onClick={handleExplorePath}
                disabled={loading || !customPrompt.trim()}>
                {loading ? 'Exploring Path...' : 'Explore Path'}
              </button>
              {loading && (
                <div className="loading-indicator">
                  <div className="spinner-small"></div>
                  <span>AI is exploring path...</span>
                </div>
              )}
            </div>
          )}

          {aiResponse && (
            <div className="ai-response">
              <h3>AI Response:</h3>
              <div className="response-content">{aiResponse}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeInteractionModal;
