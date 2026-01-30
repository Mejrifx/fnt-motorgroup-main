import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

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
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start gap-4 px-6 py-6 text-left hover:bg-gray-50 transition-colors duration-200"
      >
        {/* Plus/X Icon on the left */}
        <div className="flex-shrink-0 mt-1">
          {isOpen ? (
            <X className="w-5 h-5 text-gray-700 transition-all duration-200" />
          ) : (
            <Plus className="w-5 h-5 text-gray-700 transition-all duration-200" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          {legalBasis && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Legal basis:</span> {legalBasis}
            </p>
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6">
          {/* Add left padding to align with text above (icon width + gap) */}
          <div className="pl-9 text-gray-700 leading-relaxed space-y-4">
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
