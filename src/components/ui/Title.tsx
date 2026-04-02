import React from 'react';

const defaultTitleClassName =
  'text-4xl font-semibold text-bakery-primary mb-6 font-body';

interface TitleProps {
  title: string;
  children: React.ReactNode;
  /** Override heading size/weight; defaults to text-4xl */
  titleClassName?: string;
}

export const Title: React.FC<TitleProps> = ({
  title,
  children,
  titleClassName,
}) => {
  const headingClass = titleClassName ?? defaultTitleClassName;

  return (
    <div className="bg-white p-6 rounded-lg shadow-2xl">
      {title ? (
        <h2 className={headingClass}>{title}</h2>
      ) : null}
      <div className="text-gray-700 mb-4">{children}</div>
    </div>
  );
};