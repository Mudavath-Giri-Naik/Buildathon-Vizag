'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Zap, Send, Sparkles, Bot, User } from 'lucide-react';

interface AIEditorPanelProps {
  clarity?: number;
  tone?: number;
  structure?: number;
  length?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const recommendedSuggestions = [
  "Make it more engaging",
  "Add a call-to-action",
  "Shorten the content",
  "Make it more professional",
  "Add emojis",
  "Improve the hook",
  "Make it more casual",
  "Add statistics or data",
];

export function AIEditorPanel({ 
  clarity = 85, 
  tone = 90, 
  structure = 88, 
  length = 75 
}: AIEditorPanelProps) {
  const [chatInput, setChatInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI editor. I can help you refine your content. Just describe what you'd like to change!",
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatInput.trim()) {
      const filtered = recommendedSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(chatInput.toLowerCase())
      );
      setFilteredSuggestions(filtered.length > 0 ? filtered : recommendedSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [chatInput]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    setChatInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (chatInput.trim()) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: chatInput,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setChatInput('');
      setShowSuggestions(false);
      setIsTyping(true);

      // Simulate AI response (replace with actual API call)
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I understand you want to "${userMessage.content}". Let me help you with that. Here's what I suggest: [This would be processed by your backend API]`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (inputRef.current && !inputRef.current.contains(target)) {
        const suggestionsElement = document.querySelector('.suggestions-dropdown');
        if (suggestionsElement && !suggestionsElement.contains(target)) {
          setShowSuggestions(false);
        }
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  return (
    <Card className="h-[400px] sm:h-[500px] md:h-[600px] bg-white border border-gray-200 flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">AI Editor</h3>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start gap-1.5 sm:gap-2 max-w-[85%] sm:max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-600'
                      : 'bg-gray-100'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                  ) : (
                    <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-gray-600" />
                  )}
                </div>
                <div
                  className={`rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start gap-1.5 sm:gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-gray-600" />
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input with Suggestions */}
        <div className="p-2 sm:p-3 md:p-4 border-t border-gray-200">
          {/* Writing Quality Score - Right above input */}
          <div className="mb-2 sm:mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-700">Writing Quality Score</span>
              <span className="text-base sm:text-lg font-bold text-blue-600">
                {Math.round((clarity + tone + structure + length) / 4)}/100
              </span>
            </div>
          </div>

          <div className="relative mb-2">
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                if (chatInput.trim() || recommendedSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Describe a change..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-xs sm:text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={!chatInput.trim()}
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 p-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </Button>
          </div>

          {/* Recommended Suggestions */}
          {showSuggestions && (
            <div className="suggestions-dropdown relative mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-24 sm:max-h-32 overflow-y-auto">
              <div className="p-1.5 sm:p-2">
                <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-gray-500 mb-0.5 sm:mb-1">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Recommended
                </div>
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSuggestionClick(suggestion);
                    }}
                    className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
