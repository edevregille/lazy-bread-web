import React from 'react';

interface TitleProps {
    title: string;
    children: React.ReactNode;
  }

export const Tile: React.FC<TitleProps> = ({ title, children }) => {
    return (
        <div className="p-6 bg-white rounded-lg shadow-lg shadow-[0px_-3px_12px_rgba(128,0,128,0.4)] w-full">
            <h2 className="text-2xl font-semibold mb-4">{title}</h2>
            <div className="text-gray-700 mb-4">
                {children}
            </div>
        </div>
    );
};