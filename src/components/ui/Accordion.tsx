import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  legalBasis?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ 
  title, 
  children, 
  defaultOpen = false,
  legalBasis 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start justify-between py-6 text-left hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          {legalBasis && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Legal basis:</span> {legalBasis}
            </p>
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="pb-6 pr-12">
          <div className="text-gray-700 leading-relaxed space-y-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ children }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
      {children}
    </div>
  );
};
