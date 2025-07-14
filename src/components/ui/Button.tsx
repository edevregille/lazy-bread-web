import React, { MouseEventHandler } from 'react';

interface ButtonProps {
    label: string;
    num?: number;
    onClickAction: MouseEventHandler<HTMLButtonElement> | undefined;
  }

export const Button: React.FC<ButtonProps> = ({ label, onClickAction , num}) => {
    return (
        <>
        <button
            onClick={onClickAction}
            // className="background-gradient_indigo-purple text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none"
            className='relative background-gradient_indigo-purple text-white px-6 py-2 font-bold rounded-lg hover:bg-blue-600 focus:outline-none w-full'
        >
        {label}
        {num && num > 0 ? (
        <div className="absolute top-0 right-0 w-5 h-5 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center">
          {num}
        </div>
      ):<></>}
      </button>
      </>
    );
};