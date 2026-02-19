import { useState, useEffect } from 'react';
import { Button } from '@extension/ui';
import { t } from '@extension/i18n';
import { FiPlus, FiCheck, FiX, FiAlertCircle, FiTrash2, FiLink } from 'react-icons/fi';
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
import { MCPConnection, ServiceType, ConnectionStatus } from '@extension/storage/lib/types/mcp';

interface MCPSettingsProps {
  isDarkMode?: boolean;
}

const SERVICE_INFO: Record<
  ServiceType,
  {
    name: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    color: string;
    description: string;
  }
> = {
  [ServiceType.LINKEDIN]: {
    name: 'LinkedIn',
    icon: SiLinkedin,
    color: '#0A66C2',
    description: 'Connect posts, messages, and networking',
  },
  [ServiceType.GMAIL]: {
    name: 'Gmail',
    icon: SiGmail,
    color: '#EA4335',
    description: 'Send emails and manage inbox',
  },
  [ServiceType.WHATSAPP]: {
    name: 'WhatsApp',
    icon: SiWhatsapp,
    color: '#25D366',
    description: 'Send messages and manage contacts',
  },
  [ServiceType.SLACK]: {
    name: 'Slack',
    icon: SiSlack,
    color: '#4A154B',
    description: 'Post messages and manage channels',
  },
  [ServiceType.NOTION]: {
    name: 'Notion',
    icon: SiNotion,
    color: '#000000',
    description: 'Create pages and manage databases',
  },
  [ServiceType.TWITTER]: {
    name: 'Twitter/X',
    icon: SiX,
    color: '#1DA1F2',
    description: 'Post tweets and manage timeline',
  },
  [ServiceType.CALENDAR]: {
    name: 'Google Calendar',
    icon: SiGooglecalendar,
    color: '#4285F4',
    description: 'Create events and manage schedule',
  },
  [ServiceType.DRIVE]: {
    name: 'Google Drive',
    icon: SiGoogledrive,
    color: '#4285F4',
    description: 'Upload files and manage documents',
  },
  [ServiceType.TRELLO]: {
    name: 'Trello',
    icon: SiTrello,
    color: '#0052CC',
    description: 'Create cards and manage boards',
  },
  [ServiceType.GITHUB]: {
    name: 'GitHub',
    icon: SiGithub,
    color: '#181717',
    description: 'Create issues and manage repositories',
  },
};

export const MCPSettings = ({ isDarkMode = false }: MCPSettingsProps) => {
  const [connections, setConnections] = useState<MCPConnection[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState<ServiceType | null>(null);
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const conns = await mcpSettingsStore.getConnections();
      setConnections(conns);
    } catch (error) {
      console.error('Failed to load MCP connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAddConnection = async () => {
    if (!selectedServiceToAdd) return;

    try {
      // For now, we'll create a mock connection (no actual OAuth)
      await mcpSettingsStore.addConnection({
        serviceName: SERVICE_INFO[selectedServiceToAdd].name,
        serviceType: selectedServiceToAdd,
        status: ConnectionStatus.CONNECTED,
        customUrl: customUrl.trim() || undefined,
      });
      await loadConnections();
      setShowAddModal(false);
      resetAddState();
    } catch (error) {
      console.error('Failed to add connection:', error);
    }
  };

  const resetAddState = () => {
    setSelectedServiceToAdd(null);
    setCustomUrl('');
  };

  const handleRemoveConnection = async (id: string) => {
    try {
      await mcpSettingsStore.removeConnection(id);
      await loadConnections();
    } catch (error) {
      console.error('Failed to remove connection:', error);
    }
  };

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return <FiCheck className="text-green-500" />;
      case ConnectionStatus.DISCONNECTED:
        return <FiX className="text-gray-500" />;
      case ConnectionStatus.ERROR:
        return <FiAlertCircle className="text-red-500" />;
      default:
        return <FiAlertCircle className="text-yellow-500" />;
    }
  };

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.DISCONNECTED:
        return 'Disconnected';
      case ConnectionStatus.ERROR:
        return 'Error';
      default:
        return 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">MCP Connections</h2>
          <p className="mt-1 text-sm text-gray-400">Connect services to automate tasks and workflows</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-all hover:bg-blue-700">
          <FiPlus className="size-4" />
          Add Connection
        </Button>
      </div>

      {/* Connected Services */}
      {connections.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {connections.map(connection => {
            const serviceInfo = SERVICE_INFO[connection.serviceType];
            const Icon = serviceInfo?.icon || FiLink;
            return (
              <div
                key={connection.id}
                className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gray-900 p-5 transition-all hover:border-gray-600 hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-12 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${serviceInfo?.color}20` }}>
                      <Icon className="size-6" style={{ color: serviceInfo?.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{connection.serviceName}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        {getStatusIcon(connection.status)}
                        <span className="text-gray-400">{getStatusText(connection.status)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveConnection(connection.id)}
                    className="rounded-lg bg-gray-800 p-2 text-gray-400 opacity-0 transition-all hover:bg-red-600 hover:text-white group-hover:opacity-100">
                    <FiTrash2 className="size-4" />
                  </Button>
                </div>
                {connection.lastUsed && (
                  <div className="mt-3 text-xs text-gray-500">
                    Last used: {new Date(connection.lastUsed).toLocaleString()}
                  </div>
                )}
                {connection.customUrl && (
                  <div className="mt-2 flex items-center gap-2 rounded bg-gray-800 p-2 text-xs text-gray-400">
                    <FiLink className="size-3 shrink-0" />
                    <span className="truncate">{connection.customUrl}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-12 text-center">
          <FiLink className="mx-auto mb-4 size-12 text-gray-600" />
          <h3 className="mb-2 text-lg font-semibold text-white">No connections yet</h3>
          <p className="mb-4 text-sm text-gray-400">Add your first connection to start automating tasks</p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-all hover:bg-blue-700">
            Add Connection
          </Button>
        </div>
      )}

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Add Connection</h3>
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  resetAddState();
                }}
                className="rounded-lg bg-gray-800 p-2 text-gray-400 transition-all hover:bg-gray-700 hover:text-white">
                <FiX className="size-5" />
              </Button>
            </div>

            {selectedServiceToAdd ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                  {(() => {
                    const info = SERVICE_INFO[selectedServiceToAdd];
                    const Icon = info.icon;
                    return (
                      <>
                        <div
                          className="flex size-12 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${info.color}20` }}>
                          <Icon className="size-6" style={{ color: info.color }} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{info.name}</h4>
                          <p className="text-sm text-gray-400">{info.description}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Service URL (Optional)</label>
                  <p className="mb-2 text-xs text-gray-400">
                    Add a specific URL or endpoint for the AI to use with this service.
                  </p>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                    placeholder="e.g., https://api.myservice.com/v1"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setSelectedServiceToAdd(null)}
                    className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white transition-all hover:bg-gray-700">
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmAddConnection}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-all hover:bg-blue-700">
                    Connect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(SERVICE_INFO).map(([type, info]) => {
                  const Icon = info.icon;
                  const isConnected = connections.some(c => c.serviceType === type);
                  return (
                    <button
                      key={type}
                      onClick={() => !isConnected && setSelectedServiceToAdd(type as ServiceType)}
                      disabled={isConnected}
                      className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                        isConnected
                          ? 'cursor-not-allowed border-gray-700 bg-gray-800/50 opacity-50'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:shadow-lg'
                      }`}>
                      <div className="flex items-start gap-3">
                        <div
                          className="flex size-12 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${info.color}20` }}>
                          <Icon className="size-6" style={{ color: info.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white">{info.name}</h4>
                            {isConnected && <span className="text-xs text-green-500">✓ Connected</span>}
                          </div>
                          <p className="mt-1 text-xs text-gray-400">{info.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm text-blue-400">
                <strong>Note:</strong> This is a demo version. In production, each service would require OAuth
                authentication.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPSettings;
