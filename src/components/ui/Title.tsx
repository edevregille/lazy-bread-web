import React from 'react';

interface TitleProps {
    title: string;
    children: React.ReactNode;
  }

export const Title: React.FC<TitleProps> = ({ title, children }) => {
    return (
        // <div className="p-6 bg-white rounded-lg shadow-lg shadow-[0px_3px_8px_rgba(255,165,0,0.4),0px_-3px_8px_rgba(255,165,0,0.4),3px_0px_8px_rgba(255,165,0,0.4),-3px_0px_8px_rgba(255,165,0,0.4)] w-full">
           <div className="bg-white p-6 rounded-lg shadow-2xl" >
            <h2 className="text-4xl font-semibold text-bakery-primary mb-6">{title}</h2>
            <div className="text-gray-700 mb-4">
                {children}
            </div>
        </div>
    );
};