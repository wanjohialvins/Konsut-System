import React from 'react';
import type { User } from '../../types/types';
import { FiUser } from "react-icons/fi";
import { ROLE_DEFINITIONS } from '../../config/permissions';

interface UserAvatarProps {
    user: User | null;
    size?: number;
    className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 36, className = "" }) => {
    // 1. Check for custom user icon (if implemented in future, e.g. user.avatarUrl)
    // For now, we rely on role-based icons

    // 2. Get Role Definition
    const roleKey = user?.role || 'viewer';
    const roleDef = ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS['viewer'];
    const Icon = roleDef.icon || FiUser;

    // 3. Get Color
    // Use the colorClass from definition, or fallback
    const colorClass = roleDef.colorClass;

    return (
        <div
            className={`rounded-full flex items-center justify-center border border-gray-200 dark:border-midnight-700 ${colorClass} ${className}`}
            style={{ width: size, height: size }}
            title={roleDef.label}
        >
            <Icon size={size * 0.6} />
        </div>
    );
};

export default UserAvatar;
