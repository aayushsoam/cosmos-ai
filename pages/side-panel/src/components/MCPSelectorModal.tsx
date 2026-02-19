import { useState, useEffect } from 'react';
import mcpSettingsStore from '@extension/storage/lib/settings/mcpSettings';
import { MCPConnection, ServiceType } from '@extension/storage/lib/types/mcp';
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
import { FiLink } from 'react-icons/fi';

interface MCPSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedConnections: MCPConnection[]) => void;
  isDarkMode?: boolean;
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

export default function MCPSelectorModal({ isOpen, onClose, onConfirm, isDarkMode = true }: MCPSelectorModalProps) {
  const [connections, setConnections] = useState<MCPConnection[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConnections();
    } else {
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const conns = await mcpSettingsStore.getConnections();
      setConnections(conns);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleConnection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    const selected = connections.filter(c => selectedIds.has(c.id));
    onConfirm(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className={`flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border shadow-2xl ${
          isDarkMode ? 'border-white bg-black text-white' : 'bg-white text-gray-900'
        }`}>
        {/* Header */}
        <div className={`border-b px-6 py-4 ${isDarkMode ? 'border-white' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Select MCP Tools</h2>
            <button
              onClick={onClose}
              className={`rounded-lg border p-1.5 transition-colors ${
                isDarkMode
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}>
              <span className="text-xl">×</span>
            </button>
          </div>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
            Choose tools to provide context for your request
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
            </div>
          ) : connections.length === 0 ? (
            <div className={`py-8 text-center ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
              <FiLink className="mx-auto mb-2 size-8 opacity-50" />
              <p>No connections found</p>
              <p className="text-xs opacity-70">Add connections in Settings &gt; MCP</p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map(connection => {
                const Icon = SERVICE_ICONS[connection.serviceType] || FiLink;
                const isSelected = selectedIds.has(connection.id);
                return (
                  <button
                    key={connection.id}
                    onClick={() => toggleConnection(connection.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? isDarkMode
                          ? 'border-white bg-white text-black'
                          : 'bg-blue-50 border-blue-200'
                        : isDarkMode
                          ? 'border-white bg-black text-white hover:bg-white hover:text-black'
                          : 'hover:bg-gray-50 border-gray-200'
                    }`}>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                        isSelected ? 'border-current bg-current' : isDarkMode ? 'border-white' : 'border-gray-300'
                      }`}>
                      {isSelected && <span className={`text-xs ${isDarkMode ? 'text-black' : 'text-white'}`}>✓</span>}
                    </div>

                    <Icon className="size-5 shrink-0" />

                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{connection.serviceName}</div>
                      {connection.customUrl && (
                        <div className="truncate text-xs opacity-70">{connection.customUrl}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t px-6 py-4 ${isDarkMode ? 'border-white' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
              {selectedIds.size} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'border-white bg-black text-white hover:bg-white hover:text-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedIds.size === 0}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedIds.size === 0
                    ? 'cursor-not-allowed opacity-50'
                    : isDarkMode
                      ? 'border-white bg-black text-white hover:bg-white hover:text-black'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                Add Context
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
