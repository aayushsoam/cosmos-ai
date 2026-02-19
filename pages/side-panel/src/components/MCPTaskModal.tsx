import { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import {
  SiLinkedin,
  SiGmail,
  SiWhatsapp,
  SiSlack,
  SiNotion,
  SiX,
  SiGooglecalendar,
  SiGoogledrive,
  SiTrello,
  SiGithub,
} from 'react-icons/si';
import mcpSettingsStore from '@extension/storage/lib/settings/mcpSettings';
import { MCPConnection, ServiceType, TaskStatus } from '@extension/storage/lib/types/mcp';

interface MCPTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SERVICE_ICONS: Record<ServiceType, React.ComponentType<{ className?: string }>> = {
  [ServiceType.LINKEDIN]: SiLinkedin,
  [ServiceType.GMAIL]: SiGmail,
  [ServiceType.WHATSAPP]: SiWhatsapp,
  [ServiceType.SLACK]: SiSlack,
  [ServiceType.NOTION]: SiNotion,
  [ServiceType.TWITTER]: SiX,
  [ServiceType.CALENDAR]: SiGooglecalendar,
  [ServiceType.DRIVE]: SiGoogledrive,
  [ServiceType.TRELLO]: SiTrello,
  [ServiceType.GITHUB]: SiGithub,
};

const SERVICE_ACTIONS: Record<ServiceType, Array<{ id: string; name: string; description: string }>> = {
  [ServiceType.LINKEDIN]: [
    { id: 'post', name: 'Create Post', description: 'Share a post on LinkedIn' },
    { id: 'message', name: 'Send Message', description: 'Send a message to a connection' },
  ],
  [ServiceType.GMAIL]: [
    { id: 'send_email', name: 'Send Email', description: 'Send an email' },
    { id: 'search', name: 'Search Emails', description: 'Search your inbox' },
  ],
  [ServiceType.WHATSAPP]: [{ id: 'send_message', name: 'Send Message', description: 'Send a WhatsApp message' }],
  [ServiceType.SLACK]: [
    { id: 'post_message', name: 'Post Message', description: 'Post to a channel' },
    { id: 'send_dm', name: 'Send DM', description: 'Send direct message' },
  ],
  [ServiceType.NOTION]: [
    { id: 'create_page', name: 'Create Page', description: 'Create a new page' },
    { id: 'update_db', name: 'Update Database', description: 'Update database entry' },
  ],
  [ServiceType.TWITTER]: [{ id: 'tweet', name: 'Post Tweet', description: 'Post a tweet' }],
  [ServiceType.CALENDAR]: [{ id: 'create_event', name: 'Create Event', description: 'Add calendar event' }],
  [ServiceType.DRIVE]: [{ id: 'upload', name: 'Upload File', description: 'Upload to Drive' }],
  [ServiceType.TRELLO]: [{ id: 'create_card', name: 'Create Card', description: 'Create Trello card' }],
  [ServiceType.GITHUB]: [{ id: 'create_issue', name: 'Create Issue', description: 'Create GitHub issue' }],
};

export const MCPTaskModal = ({ isOpen, onClose }: MCPTaskModalProps) => {
  const [connections, setConnections] = useState<MCPConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<MCPConnection | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [taskData, setTaskData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConnections();
    }
  }, [isOpen]);

  const loadConnections = async () => {
    try {
      const conns = await mcpSettingsStore.getConnections();
      setConnections(conns);
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!selectedConnection || !selectedAction) return;

    setLoading(true);
    try {
      await mcpSettingsStore.addTask({
        connectionId: selectedConnection.id,
        serviceType: selectedConnection.serviceType,
        action: selectedAction,
        parameters: taskData,
      });

      // Update last used timestamp
      await mcpSettingsStore.updateConnection(selectedConnection.id, {
        lastUsed: Date.now(),
      });

      // Reset and close
      setSelectedConnection(null);
      setSelectedAction('');
      setTaskData({});
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableActions = selectedConnection ? SERVICE_ACTIONS[selectedConnection.serviceType] || [] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Create MCP Task</h3>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-800 p-2 text-gray-400 transition-all hover:bg-gray-700 hover:text-white">
            <FiX className="size-5" />
          </button>
        </div>

        {connections.length === 0 ? (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 text-center">
            <p className="text-gray-400">No connections available. Please add connections in settings.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Select Service */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Select Service</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {connections.map(connection => {
                  const Icon = SERVICE_ICONS[connection.serviceType];
                  const isSelected = selectedConnection?.id === connection.id;
                  return (
                    <button
                      key={connection.id}
                      onClick={() => {
                        setSelectedConnection(connection);
                        setSelectedAction('');
                        setTaskData({});
                      }}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}>
                      <Icon className="size-5 text-blue-400" />
                      <span className="flex-1 text-sm font-medium text-white">{connection.serviceName}</span>
                      {isSelected && <FiCheck className="size-4 text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Action */}
            {selectedConnection && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Select Action</label>
                <div className="space-y-2">
                  {availableActions.map(action => {
                    const isSelected = selectedAction === action.id;
                    return (
                      <button
                        key={action.id}
                        onClick={() => setSelectedAction(action.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-white">{action.name}</div>
                            <div className="mt-1 text-xs text-gray-400">{action.description}</div>
                          </div>
                          {isSelected && <FiCheck className="size-4 text-blue-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Task Details */}
            {selectedAction && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Task Details</label>
                <textarea
                  value={taskData.content || ''}
                  onChange={e => setTaskData({ ...taskData, content: e.target.value })}
                  placeholder="Enter task details..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  rows={4}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white transition-all hover:bg-gray-700">
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!selectedConnection || !selectedAction || loading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MCPTaskModal;
