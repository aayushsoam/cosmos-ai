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
    color: 'text-white',
    bgColor: 'bg-black text-white border border-gray-700',
  },
  [ProviderTypeEnum.Anthropic]: {
    id: ProviderTypeEnum.Anthropic,
    name: 'Anthropic',
    icon: FaRobot,
    color: 'text-white',
    bgColor: 'bg-black text-white border border-gray-700',
  },
  [ProviderTypeEnum.DeepSeek]: {
    id: ProviderTypeEnum.DeepSeek,
    name: 'DeepSeek',
    icon: FaTerminal,
    color: 'text-white',
    bgColor: 'bg-black text-white border border-gray-700',
  },
  [ProviderTypeEnum.Gemini]: {
    id: ProviderTypeEnum.Gemini,
    name: 'Gemini',
    icon: FaGooglePlay,
    color: 'text-white',
    bgColor: 'bg-black text-white border border-gray-700',
  },
  [ProviderTypeEnum.Groq]: {
    id: ProviderTypeEnum.Groq,
    name: 'Groq',
    icon: FaTerminal,
    color: 'text-white',
    bgColor: 'bg-black text-white border border-gray-700',
  },
  [ProviderTypeEnum.Ollama]: {
    id: ProviderTypeEnum.Ollama,
    name: 'Ollama',
    icon: FiServer,
    color: 'text-white',
    bgColor: 'bg-black text-white border border-gray-700',
  },
  [ProviderTypeEnum.AzureOpenAI]: {
    id: ProviderTypeEnum.AzureOpenAI,
    name: 'Azure OpenAI',
    icon: SiAmazon,
    color: 'text-white',
    bgColor: 'bg-black text-white border border-gray-700',
  },
  [ProviderTypeEnum.OpenRouter]: {
    id: ProviderTypeEnum.OpenRouter,
    name: 'OpenRouter',
    icon: FiGlobe,
    color: 'text-white',
    bgColor: 'bg-black text-white border border-gray-700',
  },
  [ProviderTypeEnum.Cerebras]: {
    id: ProviderTypeEnum.Cerebras,
    name: 'Cerebras',
    icon: FaRobot,
    color: 'text-white',
    bgColor: 'bg-black text-white border border-gray-700',
  },
  [ProviderTypeEnum.Llama]: {
    id: ProviderTypeEnum.Llama,
    name: 'Llama',
    icon: FaRobot,
    color: 'text-white',
    bgColor: 'bg-black text-white border border-gray-700',
  },
};

const CUSTOM_PROVIDER_OPTION: ProviderOption = {
  id: ProviderTypeEnum.CustomOpenAI,
  name: 'OpenAI-compatible API Provider',
  icon: FiGlobe,
  color: 'text-gray-600',
  bgColor: 'bg-black text-white border border-gray-700',
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
        isDarkMode ? 'border-slate-600 bg-black shadow-slate-900/50' : 'border-gray-200 bg-white shadow-gray-100'
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
