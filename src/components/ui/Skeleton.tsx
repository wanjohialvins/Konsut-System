import React from 'react';

export const Skeleton: React.FC<{ className?: string; count?: number }> = ({
    className = '',
    count = 1
}) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`animate-pulse bg-gray-200 rounded ${className}`}
                />
            ))}
        </>
    );
};
