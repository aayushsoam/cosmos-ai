import { ShinyTextDisplay } from './ShinyText';
import { FaBrain, FaRobot, FaGears } from 'react-icons/fa';

export type AgentType = 'thinker' | 'system' | 'navigation';

export interface AgentStatusItem {
  type: AgentType;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
}

interface AgentStatusProps {
  agents: AgentStatusItem[];
  isDarkMode?: boolean;
}

export const AgentStatus: React.FC<AgentStatusProps> = ({ agents, isDarkMode = true }) => {
  const getAgentIcon = (type: AgentType) => {
    switch (type) {
      case 'thinker':
        return <FaBrain className="h-5 w-5 text-purple-400" />;
      case 'navigation':
        return <FaRobot className="h-5 w-5 text-blue-400" />;
      case 'system':
        return <FaGears className="h-5 w-5 text-green-400" />;
      default:
        return <FaGears className="h-5 w-5 text-gray-400" />;
    }
  };

  const getAgentLabel = (type: AgentType) => {
    switch (type) {
      case 'thinker':
        return 'Thinker';
      case 'navigation':
        return 'Navigator';
      case 'system':
        return 'System';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return isDarkMode ? 'text-gray-400' : 'text-gray-500';
      case 'running':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      case 'completed':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'error':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending...';
      case 'running':
        return 'Processing...';
      case 'completed':
        return 'Completed ✓';
      case 'error':
        return 'Error ✗';
      default:
        return 'Unknown';
    }
  };

  if (agents.length === 0) {
    return null;
  }

  return (
    <div
      className={`space-y-2 rounded-lg border p-4 ${
        isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-300 bg-gray-100'
      }`}>
      <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Agent Status</h3>

      {agents.map(agent => (
        <div
          key={agent.type}
          className={`flex items-start gap-3 rounded-md p-2 transition-all ${
            isDarkMode ? 'bg-slate-700/50' : 'bg-gray-200/50'
          }`}>
          {/* Icon */}
          <div className="mt-0.5 flex-shrink-0">{getAgentIcon(agent.type)}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {getAgentLabel(agent.type)}
              </span>

              {/* Status with shiny text effect for running state */}
              {agent.status === 'running' ? (
                <ShinyTextDisplay
                  text={getStatusText(agent.status)}
                  disabled={false}
                  speed={2}
                  className={`text-xs font-medium ${getStatusColor(agent.status)}`}
                />
              ) : (
                <span className={`text-xs font-medium ${getStatusColor(agent.status)}`}>
                  {getStatusText(agent.status)}
                </span>
              )}
            </div>

            {/* Message */}
            {agent.message && (
              <p className={`mt-1 text-xs line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {agent.message}
              </p>
            )}

            {/* Progress indicator for running state */}
            {agent.status === 'running' && (
              <div className="mt-2 h-1 w-full bg-gray-600/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"
                  style={{
                    animation: 'shimmer 2s infinite',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Sequential indicator */}
      {agents.length > 1 && (
        <div
          className={`mt-3 flex items-center justify-center gap-2 text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
          {agents.map((agent, index) => (
            <div key={agent.type} className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  agent.status === 'completed'
                    ? 'bg-green-400'
                    : agent.status === 'running'
                      ? 'bg-yellow-400 animate-pulse'
                      : 'bg-gray-500'
                }`}
              />
              {index < agents.length - 1 && (
                <div
                  className={`h-0.5 w-4 ${
                    agents[index + 1].status === 'completed' || agents[index + 1].status === 'running'
                      ? 'bg-yellow-400'
                      : 'bg-gray-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AgentStatus;
