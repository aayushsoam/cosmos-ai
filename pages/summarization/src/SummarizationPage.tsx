import React, { useState, useEffect } from 'react';
import MindMap from './components/MindMap';
import NodeInteractionModal from './components/NodeInteractionModal';
import { AIService } from './services/aiService';
import './SummarizationPage.css';

// Declare chrome API types
declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

interface MindMapNode {
  id: string;
  label: string;
  content: string;
  children?: MindMapNode[];
  x?: number;
  y?: number;
  aiAnswer?: string;
}

const SummarizationPage: React.FC = () => {
  const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taskId, setTaskId] = useState<string | null>(null);

  useEffect(() => {
    // Get summarization data from storage or URL params
    const loadSummarizationData = async () => {
      try {
        // Get task data from URL params or storage
        const urlParams = new URLSearchParams(window.location.search);
        const currentTaskId = urlParams.get('taskId');
        const taskText = urlParams.get('task');

        if (currentTaskId) {
          setTaskId(currentTaskId);
          // Load from storage
          const result = await chrome.storage.local.get(`summarization_${currentTaskId}`);
          if (result[`summarization_${currentTaskId}`]) {
            setMindMapData(result[`summarization_${currentTaskId}`]);
            setLoading(false);
            return;
          }
        }

        // Generate mock data for now (will be replaced with actual summarization)
        if (taskText) {
          const mockData = generateMockMindMap(taskText);
          setMindMapData(mockData);
          if (currentTaskId) {
            await chrome.storage.local.set({ [`summarization_${currentTaskId}`]: mockData });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading summarization data:', error);
        setLoading(false);
      }
    };

    loadSummarizationData();
  }, []);

  const generateMockMindMap = (taskText: string): MindMapNode => {
    // Extract main topic from task text
    const mainTopic = taskText.length > 50 ? taskText.substring(0, 47) + '...' : taskText;

    // This will be replaced with actual AI summarization
    return {
      id: 'root',
      label: mainTopic,
      content: `Task: ${taskText}`,
      children: [
        {
          id: '1',
          label: 'Time Management & Workflow',
          content: 'Effective time management strategies and workflow optimization techniques.',
          children: [
            {
              id: '1-1',
              label: 'Pomodoro Technique',
              content: '25 min focus, 5 min break. Avoid burnout and maintain productivity.',
            },
            {
              id: '1-2',
              label: 'Spaced Repetition',
              content: 'Review material at increasing intervals. Enhances long-term retention.',
            },
            {
              id: '1-3',
              label: 'Interleaving',
              content: 'Mix different subjects/topics. Improves problem-solving skills.',
            },
          ],
        },
        {
          id: '2',
          label: 'Active Recall',
          content: 'Techniques for actively retrieving information from memory.',
          children: [
            {
              id: '2-1',
              label: 'Retrieval Practice',
              content: 'Quiz yourself regularly. Use flashcards for active learning.',
            },
            {
              id: '2-2',
              label: 'Elaborative Rehearsal',
              content: 'Explain concepts in your own words. Connect to existing knowledge.',
            },
            {
              id: '2-3',
              label: 'Self-Explanation',
              content: 'Articulate your thought process. Identify gaps in understanding.',
            },
          ],
        },
      ],
    };
  };

  const handleNodeClick = (node: MindMapNode) => {
    setSelectedNode(node);
    setShowModal(true);
  };

  const handleGetAIAnswer = async (topic: string): Promise<string> => {
    try {
      const context = selectedNode?.content || '';
      const answer = await AIService.getAnswerForTopic(topic, context);

      // Create a new child node with AI answer (connected to the selected node)
      if (selectedNode && mindMapData) {
        const newAnswerId = `${selectedNode.id}-answer-${Date.now()}`;
        const newAnswerNode: MindMapNode = {
          id: newAnswerId,
          label: `Answer: ${topic}`,
          content: answer,
          aiAnswer: answer,
        };

        const addAnswerNode = (nodes: MindMapNode[]): MindMapNode[] => {
          return nodes.map(n => {
            if (n.id === selectedNode.id) {
              return {
                ...n,
                children: [...(n.children || []), newAnswerNode],
              };
            }
            if (n.children) {
              return { ...n, children: addAnswerNode(n.children) };
            }
            return n;
          });
        };

        const updatedData = {
          ...mindMapData,
          children: mindMapData.children ? addAnswerNode(mindMapData.children) : undefined,
        };

        setMindMapData(updatedData);

        // Save to storage
        if (taskId) {
          await chrome.storage.local.set({ [`summarization_${taskId}`]: updatedData });
        }
      }

      return answer;
    } catch (error) {
      console.error('Error getting AI answer:', error);
      throw error;
    }
  };

  const handleExplorePath = async (topic: string, prompt: string): Promise<void> => {
    try {
      const context = selectedNode?.content || '';
      const answer = await AIService.explorePath(topic, prompt, context);

      // Create a new child node with the exploration result
      if (selectedNode && mindMapData) {
        const newChildId = `${selectedNode.id}-${Date.now()}`;
        const newChild: MindMapNode = {
          id: newChildId,
          label: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
          content: answer,
        };

        const addChildToNode = (nodes: MindMapNode[]): MindMapNode[] => {
          return nodes.map(n => {
            if (n.id === selectedNode.id) {
              return {
                ...n,
                children: [...(n.children || []), newChild],
              };
            }
            if (n.children) {
              return { ...n, children: addChildToNode(n.children) };
            }
            return n;
          });
        };

        const updatedData = {
          ...mindMapData,
          children: mindMapData.children ? addChildToNode(mindMapData.children) : undefined,
        };

        setMindMapData(updatedData);

        // Save to storage
        if (taskId) {
          await chrome.storage.local.set({ [`summarization_${taskId}`]: updatedData });
        }
      }
    } catch (error) {
      console.error('Error exploring path:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="summarization-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Generating summary...</p>
        </div>
      </div>
    );
  }

  const [sourcesCount] = useState(1); // Can be dynamic based on actual sources

  return (
    <div className="summarization-page">
      <header className="summarization-header">
        <div className="header-title-section">
          <h1>{mindMapData?.label || 'Summary'}</h1>
          {mindMapData && (
            <p className="sources-info">
              Based on {sourcesCount} source{sourcesCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button className="close-button" onClick={() => window.close()} aria-label="Close">
            ✕
          </button>
        </div>
      </header>
      <main className="summarization-main">
        {mindMapData ? (
          <>
            <MindMap data={mindMapData} onNodeClick={handleNodeClick} selectedNode={selectedNode} />
            {/* Feedback Buttons */}
            <div className="feedback-controls">
              <button className="feedback-btn good" title="Good content">
                👍
              </button>
              <button className="feedback-btn bad" title="Bad content">
                👎
              </button>
            </div>
          </>
        ) : (
          <div className="no-data">
            <p>No summarization data available.</p>
          </div>
        )}
      </main>

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
