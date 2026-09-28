import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

import {
    asyncRoutes,
    constantRoutes
} from '@/router'

import type {
    RouteRecordRaw
} from 'vue-router'

// ============================================================
// NORMALIZE ROLE
// ============================================================

function normalizeRole(
    roleName: string
): string {
    return String(
        roleName || ''
    )
        .trim()
        .toLowerCase()
}

// ============================================================
// CHECK ROUTE ACCESS
// ============================================================

function hasPermission(
    permissions: string[],
    roleName: string,
    route: RouteRecordRaw
): boolean {

    const meta =
        route.meta as any

    if (!meta) {
        return true
    }

    const role =
        normalizeRole(
            roleName
        )

    // ==========================================================
    // 1. ROLE-RESTRICTED ROUTES
    //
    // IMPORTANT:
    // This is checked BEFORE Owner/System Admin permission bypass.
    //
    // Example:
    //
    // meta: {
    //   roles: ['system admin']
    // }
    //
    // Only System Admin gets this route.
    // Owner does NOT bypass this restriction.
    // ==========================================================

    if (
        Array.isArray(meta.roles) &&
        meta.roles.length > 0
    ) {

        const allowedRoles =
            meta.roles.map(
                (allowedRole: string) =>
                    normalizeRole(
                        allowedRole
                    )
            )

        return allowedRoles.includes(
            role
        )
    }

    // ==========================================================
    // 2. SINGLE PERMISSION
    // ==========================================================

    if (
        meta.permission
    ) {

        // System Admin receives all normal permission routes.
        if (
            role ===
            'system admin'
        ) {
            return true
        }

        // Owner receives all normal company-level permission routes.
        if (
            role ===
            'owner'
        ) {
            return true
        }

        return permissions.includes(
            meta.permission as string
        )
    }

    // ==========================================================
    // 3. MULTIPLE PERMISSIONS
    // ==========================================================

    if (
        Array.isArray(
            meta.permissions
        ) &&
        meta.permissions.length > 0
    ) {

        // System Admin bypass
        if (
            role ===
            'system admin'
        ) {
            return true
        }

        // Owner bypass
        if (
            role ===
            'owner'
        ) {
            return true
        }

        return meta.permissions.some(
            (permission: string) =>
                permissions.includes(
                    permission
                )
        )
    }

    // ==========================================================
    // 4. ROUTE HAS NO RESTRICTIONS
    // ==========================================================

    return true
}

// ============================================================
// FILTER ASYNC ROUTES
// ============================================================

export function filterAsyncRoutes(
    routes: RouteRecordRaw[],
    permissions: string[],
    roleName: string
): RouteRecordRaw[] {

    const result:
        RouteRecordRaw[] = []

    routes.forEach(
        route => {

            const current:
                RouteRecordRaw =
            {
                ...route
            }

            // ========================================================
            // CHECK CURRENT ROUTE
            // ========================================================

            if (
                !hasPermission(
                    permissions,
                    roleName,
                    current
                )
            ) {
                return
            }

            // ========================================================
            // FILTER CHILDREN
            // ========================================================

            if (
                current.children
            ) {

                current.children =
                    filterAsyncRoutes(
                        current.children,
                        permissions,
                        roleName
                    )

                const meta =
                    current.meta as any

                // Parent menus that exist only to contain child pages
                // should disappear when all children are removed.
                //
                // If the parent itself has explicit permission/role
                // restrictions, we allow it to remain.
                if (
                    current.children.length ===
                    0 &&

                    !meta?.permission &&

                    !meta?.permissions &&

                    !meta?.roles
                ) {
                    return
                }
            }

            result.push(
                current
            )
        }
    )

    return result
}

// ============================================================
// PERMISSION STORE
// ============================================================

export const usePermissionStore =
    defineStore(
        'permission',
        () => {

            const routes =
                ref<RouteRecordRaw[]>(
                    []
                )

            const addRoutes =
                ref<RouteRecordRaw[]>(
                    []
                )

            // ========================================================
            // SET ROUTES
            // ========================================================

            function setRoutes(
                newRoutes:
                    RouteRecordRaw[]
            ) {

                addRoutes.value =
                    newRoutes

                routes.value =
                    constantRoutes.concat(
                        newRoutes
                    )
            }

            // ========================================================
            // GENERATE ROUTES
            //
            // IMPORTANT:
            //
            // We ALWAYS filter routes now.
            //
            // Previously:
            //
            // Owner -> ALL asyncRoutes
            //
            // That caused System Admin-only routes such as Companies
            // to appear for Owner.
            //
            // Now role restrictions are always respected.
            // ========================================================

            function generateRoutes(
                permissions: string[],
                roleName: string
            ): RouteRecordRaw[] {

                const accessedRoutes =
                    filterAsyncRoutes(
                        asyncRoutes || [],
                        permissions || [],
                        roleName || ''
                    )

                setRoutes(
                    accessedRoutes
                )

                return accessedRoutes
            }

            return {
                routes,
                addRoutes,
                setRoutes,
                generateRoutes
            }
        }
    )

// ============================================================
// HMR
// ============================================================

if (
    import.meta.hot
) {
    import.meta.hot.accept(
        acceptHMRUpdate(
            usePermissionStore,
            import.meta.hot
        )
    )
}