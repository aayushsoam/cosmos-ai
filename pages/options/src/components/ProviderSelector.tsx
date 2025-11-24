import { ProviderTypeEnum } from '@extension/storage';
import { SiOpenai, SiAmazon } from 'react-icons/si';
import { FaRobot, FaGooglePlay, FaTerminal } from 'react-icons/fa';
import { FiGlobe, FiServer } from 'react-icons/fi';
import type { FC } from 'react';

interface ProviderOption {
  id: string;
  name: string;
  icon: FC<{ className?: string }>;
  color: string;
  bgColor: string;
}

const PROVIDER_OPTIONS: Record<string, ProviderOption> = {
  [ProviderTypeEnum.OpenAI]: {
    id: ProviderTypeEnum.OpenAI,
    name: 'OpenAI',
    icon: SiOpenai,
    color: 'text-black dark:text-white',
    bgColor: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  },
  [ProviderTypeEnum.Anthropic]: {
    id: ProviderTypeEnum.Anthropic,
    name: 'Anthropic',
    icon: FaRobot,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
  },
  [ProviderTypeEnum.DeepSeek]: {
    id: ProviderTypeEnum.DeepSeek,
    name: 'DeepSeek',
    icon: FaTerminal,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
  },
  [ProviderTypeEnum.Gemini]: {
    id: ProviderTypeEnum.Gemini,
    name: 'Gemini',
    icon: FaGooglePlay,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
  },
  [ProviderTypeEnum.Groq]: {
    id: ProviderTypeEnum.Groq,
    name: 'Groq',
    icon: FaTerminal,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800',
  },
  [ProviderTypeEnum.Ollama]: {
    id: ProviderTypeEnum.Ollama,
    name: 'Ollama',
    icon: FiServer,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800',
  },
  [ProviderTypeEnum.AzureOpenAI]: {
    id: ProviderTypeEnum.AzureOpenAI,
    name: 'Azure OpenAI',
    icon: SiAmazon,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
  },
  [ProviderTypeEnum.OpenRouter]: {
    id: ProviderTypeEnum.OpenRouter,
    name: 'OpenRouter',
    icon: FiGlobe,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800',
  },
  [ProviderTypeEnum.Cerebras]: {
    id: ProviderTypeEnum.Cerebras,
    name: 'Cerebras',
    icon: FaRobot,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800',
  },
  [ProviderTypeEnum.Llama]: {
    id: ProviderTypeEnum.Llama,
    name: 'Llama',
    icon: FaRobot,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
  },
};

const CUSTOM_PROVIDER_OPTION: ProviderOption = {
  id: ProviderTypeEnum.CustomOpenAI,
  name: 'OpenAI-compatible API Provider',
  icon: FiGlobe,
  color: 'text-gray-600',
  bgColor: 'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800',
};

interface ProviderSelectorProps {
  isDarkMode?: boolean;
  isOpen: boolean;
  onSelect: (providerType: string) => void;
  providersFromStorage: Set<string>;
  modifiedProviders: Set<string>;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  isDarkMode = false,
  isOpen,
  onSelect,
  providersFromStorage,
  modifiedProviders,
}: ProviderSelectorProps) => {
  if (!isOpen) return null;

  const availableProviders = Object.values(ProviderTypeEnum)
    .filter(
      type =>
        type === ProviderTypeEnum.AzureOpenAI || // Always show Azure
        (type !== ProviderTypeEnum.CustomOpenAI && !providersFromStorage.has(type) && !modifiedProviders.has(type)),
    )
    .map(type => PROVIDER_OPTIONS[type])
    .filter(Boolean);

  return (
    <div
      className={`absolute z-20 mt-2 max-h-[500px] w-full overflow-y-auto rounded-lg border shadow-lg ${
        isDarkMode ? 'border-slate-600 bg-slate-800 shadow-slate-900/50' : 'border-gray-200 bg-white shadow-gray-100'
      }`}>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Built-in Providers */}
          {availableProviders.map(provider => (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelect(provider.id)}
              className={`flex items-center space-x-2 rounded-lg p-3 transition-all duration-200 hover:scale-105 ${
                provider.bgColor
              } ${isDarkMode ? 'hover:opacity-80' : 'hover:shadow-md'}`}>
              <provider.icon className={`size-5 shrink-0 ${provider.color}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {provider.name}
              </span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className={`my-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`} />

        {/* Custom Provider */}
        <button
          type="button"
          onClick={() => onSelect(ProviderTypeEnum.CustomOpenAI)}
          className={`flex w-full items-center space-x-2 rounded-lg p-3 transition-all duration-200 hover:scale-105 ${
            CUSTOM_PROVIDER_OPTION.bgColor
          } ${isDarkMode ? 'hover:opacity-80' : 'hover:shadow-md'}`}>
          <CUSTOM_PROVIDER_OPTION.icon className={`size-5 shrink-0 ${CUSTOM_PROVIDER_OPTION.color}`} />
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {CUSTOM_PROVIDER_OPTION.name}
          </span>
        </button>
      </div>
    </div>
  );
};

export const getProviderOption = (providerId: string): ProviderOption | null => {
  if (providerId === ProviderTypeEnum.CustomOpenAI) {
    return CUSTOM_PROVIDER_OPTION;
  }
  return PROVIDER_OPTIONS[providerId] || null;
};
