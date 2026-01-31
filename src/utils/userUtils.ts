
import type { User } from "../types/types";
import { parsePermissions } from "./permissionUtils";
import { ROLE_DEFINITIONS } from "../config/permissions";

/**
 * Normalizes user data from the backend into a consistent User object.
 * Handles parsing permissions, setting display roles, and ensuring defaults.
 */
export const normalizeUser = (backendUser: any): User => {
    if (!backendUser) {
        throw new Error("Cannot normalize null user");
    }

    const roleKey = (backendUser.role || 'viewer').toLowerCase();
    const roleDef = ROLE_DEFINITIONS[roleKey];

    // Use definition label if available, otherwise capitalize
    const displayRole = roleDef
        ? roleDef.label
        : roleKey.charAt(0).toUpperCase() + roleKey.slice(1);

    return {
        ...backendUser,
        role: roleKey,
        displayRole: displayRole,
        permissions: parsePermissions(backendUser.permissions),
        name: backendUser.name || backendUser.username || 'User',
        // Ensure critical fields exist even if backend misses them
        is_active: backendUser.is_active ?? true,
        id: backendUser.id
    };
};
