import React from 'react';
import type { User } from '../types/types';
import type { IconType } from 'react-icons';
import { FiShield, FiUsers, FiPackage, FiBarChart2, FiUser, FiEye, FiDollarSign, FiAward } from "react-icons/fi";

interface UserAvatarProps {
    user: User | null;
    size?: number;
    className?: string;
}

const roleIcons: Record<string, IconType> = {
    admin: FiShield,
    ceo: FiAward,
    manager: FiUsers,
    sales: FiDollarSign,
    storekeeper: FiPackage,
    accountant: FiBarChart2,
    staff: FiUser,
    viewer: FiEye
};

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 36, className = "" }) => {
    // Others get Role Icons
    const Icon = roleIcons[user?.role || 'viewer'] || FiUser;

    // Choose color based on role
    const colors: Record<string, string> = {
        admin: 'bg-red-100 text-red-600',
        ceo: 'bg-indigo-100 text-indigo-600',
        manager: 'bg-amber-100 text-amber-600',
        sales: 'bg-emerald-100 text-emerald-600',
        storekeeper: 'bg-purple-100 text-purple-600',
        accountant: 'bg-blue-100 text-blue-600',
        staff: 'bg-slate-100 text-slate-600',
        viewer: 'bg-gray-100 text-gray-500'
    };

    const colorClass = colors[user?.role || 'viewer'] || colors.viewer;

    return (
        <div
            className={`rounded-full flex items-center justify-center border border-gray-200 dark:border-midnight-700 ${colorClass} ${className}`}
            style={{ width: size, height: size }}
        >
            <Icon size={size * 0.6} />
        </div>
    );
};

export default UserAvatar;
