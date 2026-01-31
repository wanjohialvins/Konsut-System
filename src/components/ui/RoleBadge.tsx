
import React from 'react';
import { ROLE_DEFINITIONS, DEFAULT_ROLE_DEF } from '../../config/permissions';

interface RoleBadgeProps {
    role: string;
    permissionsCount?: number;
    className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, permissionsCount = 0, className = '' }) => {
    const roleKey = (role || '').toLowerCase();
    const def = ROLE_DEFINITIONS[roleKey] || DEFAULT_ROLE_DEF;
    const Icon = def.icon;

    // Format display role name if not in definition (fallback capitalizer)
    const displayName = def.id !== 'unknown'
        ? def.label
        : (role || 'No Role').charAt(0).toUpperCase() + (role || '').slice(1);

    return (
        <div className={`flex justify-center flex-col items-center gap-1 ${className}`}>
            <span className={`px-3 py-1.5 rounded-xl font-bold border capitalize text-[11px] tracking-tight flex items-center gap-2 ${def.colorClass}`}>
                <Icon size={12} />
                {displayName}
            </span>
            {permissionsCount > 0 && (
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-midnight-950 px-2 py-0.5 rounded-lg border border-gray-100 dark:border-midnight-800">
                    {permissionsCount} Custom Gates
                </span>
            )}
        </div>
    );
};

export default RoleBadge;
