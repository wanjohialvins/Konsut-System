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
    // 1. Check for custom user icon
    if (user?.avatarUrl) {
        return (
            <img
                src={user.avatarUrl}
                alt={user.username}
                className={`rounded-full object-cover border border-gray-200 dark:border-midnight-700 ${className}`}
                style={{ width: size, height: size }}
            />
        );
    }

    // 2. Fallback: Role-based icons
    const roleKey = user?.role || 'viewer';
    const roleDef = ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS['viewer'];
    const Icon = roleDef.icon || FiUser;

    // 3. Get Color
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
