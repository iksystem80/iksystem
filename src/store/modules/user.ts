import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, getInfo as apiGetInfo } from '@/api/user'
import {
    getToken,
    setToken,
    removeToken,
    getUserId,
    setUserId,
    removeUserId
} from '@/utils/auth'
import router, { resetRouter } from '@/router'
import { useTagsViewStore } from './tagsView'
import { usePermissionStore } from './permission'
import { initializeSocketListeners, cleanupSocket } from '@/services/socketListeners'
import { getClockStatus } from '@/api/employeesession'

interface LoginInfo {
    username: string
    password: string
}

export const useUserStore = defineStore('user', () => {
    // ============================================================
    // STATE
    // ============================================================

    const token = ref<string>(getToken())
    const userId = ref<string>(getUserId())

    const name = ref('')
    const avatar = ref('')

    const roles = ref<string[]>([])
    const roleId = ref<number | null>(null)
    const roleName = ref('')
    const permissions = ref<string[]>([])

    const companyId = ref<number | null>(null)
    const companyName = ref('')

    const locationId = ref('')
    const location = ref('')
    const locations = ref<any[]>([])
    const allowfaceCheckin = ref(false)

    const infoLoaded = ref(false)

    const hasfaceallowed = computed(() => allowfaceCheckin.value)

    // ============================================================
    // ROLE HELPERS
    // ============================================================

    const normalizedRole = computed(() =>
        String(roleName.value || '').trim().toLowerCase()
    )

    const isSystemAdmin = computed(
        () => normalizedRole.value === 'system admin'
    )

    const isOwner = computed(
        () => normalizedRole.value === 'owner'
    )

    const isAdmin = computed(
        () => normalizedRole.value === 'admin'
    )

    const isManager = computed(
        () => normalizedRole.value === 'manager'
    )

    const isEmployee = computed(
        () => normalizedRole.value === 'employee'
    )

    const isOwnerOrAdmin = computed(
        () => isOwner.value || isAdmin.value
    )

    const isClocked = ref(false)
    const isClockedIn = computed(() => isClocked.value)
    const activeClockSession = ref(null)

    function setClockedIn(value) {
        isClocked.value = Boolean(value)
    }

    // ============================================================
    // PERMISSION HELPER
    // ============================================================

    function isSystemAdminPermission(permission: string): boolean {
        return [
            'companies.',
            'locations.',
            'users.'
        ].some(prefix => permission.startsWith(prefix))
    }

    function hasPermission(permission: string): boolean {
        if (isSystemAdmin.value) {
            return isSystemAdminPermission(permission)
        }

        if (isOwner.value) {
            return true
        }

        return permissions.value.includes(permission)
    }

    // ============================================================
    // LOGIN
    // ============================================================

    async function login(userInfo: LoginInfo): Promise<void> {
        const response = await apiLogin({
            username: userInfo.username.trim(),
            password: userInfo.password
        })

        token.value = response.token || ''
        userId.value = String(response.userid || '')

        companyId.value =
            response.companyid != null
                ? Number(response.companyid)
                : null

        companyName.value =
            response.companyname || ''

        locationId.value =
            response.locationid != null
                ? String(response.locationid)
                : ''

        location.value =
            response.locationname || ''

        infoLoaded.value = false

        setToken(token.value)
        setUserId(userId.value)

        if (response.locationid) {
            initializeSocketListeners(response.locationid)
        }
    }

    // ============================================================
    // GET USER INFO
    // ============================================================

    async function getInfo() {
        const response = await apiGetInfo(
            token.value,
            userId.value
        )

        if (!response?.data) {
            throw new Error(
                'Verification failed, please login again.'
            )
        }

        const data = response.data

        console.log(data)
        

        roles.value =
            Array.isArray(data.roles)
                ? data.roles
                : []

        roleId.value =
            data.roleid != null
                ? Number(data.roleid)
                : null

        roleName.value =
            data.rolename || ''

        permissions.value =
            Array.isArray(data.permissions)
                ? data.permissions
                : []

        name.value =
            data.name || ''

        avatar.value =
            data.avatar || ''

        companyId.value =
            data.companyid != null
                ? Number(data.companyid)
                : null

        companyName.value =
            data.companyname || ''

        if (!locationId.value) {
            locationId.value =
                data.locationid != null
                    ? String(data.locationid)
                    : ''

            location.value = data.location || ''


            allowfaceCheckin.value = data.allowfacecheckin

            console.log('das' + allowfaceCheckin.value)
        }

        locations.value =
            Array.isArray(response.locations)
                ? response.locations
                : []

        
        infoLoaded.value = true

        return data
    }

    // ============================================================
    // REBUILD ROUTES
    // ============================================================

    async function rebuildRoutes() {
        const permissionStore = usePermissionStore()

        resetRouter()

        const accessRoutes =
            permissionStore.generateRoutes(
                permissions.value,
                roleName.value
            )

        accessRoutes.forEach(route => {
            router.addRoute(route)
        })

        const tagsViewStore = useTagsViewStore()
        tagsViewStore.delAllViews()
    }

    // ============================================================
    // CHANGE LOCATION
    // ============================================================

    async function changeLocation(
        locid: string,
        locationname: string
    ): Promise<void> {
        locationId.value = String(locid || '')
        location.value = locationname || ''

        cleanupSocket()

        if (locid) {
            initializeSocketListeners(locid)
        }

        await getInfo()
        await rebuildRoutes()
    }

    // ============================================================
    // CLEAR USER STATE
    // ============================================================

    function clearUserState(): void {
        token.value = ''
        userId.value = ''

        name.value = ''
        avatar.value = ''

        roles.value = []
        roleId.value = null
        roleName.value = ''
        permissions.value = []

        companyId.value = null
        companyName.value = ''

        locationId.value = ''
        location.value = ''
        locations.value = []

        infoLoaded.value = false
    }

    // ============================================================
    // LOGOUT
    //
    // IMPORTANT:
    // Navigate away BEFORE clearing locationId.
    // This prevents mounted pages from making requests with:
    //
    // locationid=
    // ============================================================

    async function logout(): Promise<void> {
        // Stop socket requests first.
        cleanupSocket()

        // Remove persisted authentication.
        removeToken()
        removeUserId()

        // Remove dynamic routes.
        resetRouter()

        const tagsViewStore = useTagsViewStore()
        tagsViewStore.delAllViews()

        // Leave current location-dependent page first.
        if (router.currentRoute.value.path !== '/login') {
            await router.replace('/login')
        }

        // Now it is safe to clear reactive state.
        clearUserState()
    }

    // ============================================================
    // RESET TOKEN
    //
    // Used when authentication fails.
    // Router guard handles navigation.
    // ============================================================

    function resetToken(): void {
        cleanupSocket()

        removeToken()
        removeUserId()

        clearUserState()
    }

    async function loadClockStatus() {
        try {
            if (!userId.value) {
                isClocked.value = false
                activeClockSession.value = null
                return
            }

            const response =
                await getClockStatus(
                    userId.value
                )

            isClocked.value =
                Boolean(
                    response?.data?.clockedIn
                )

            activeClockSession.value =
                response?.data?.session || null

        } catch (error) {
            console.error(
                'Unable to load clock status:',
                error
            )

            isClocked.value = false
            activeClockSession.value = null
        }
    }

    // ============================================================
    // RETURN
    // ============================================================

    return {
        token,
        userId,

        name,
        avatar,

        roles,
        roleId,
        roleName,
        permissions,

        companyId,
        companyName,

        locationId,
        location,
        locations,

        infoLoaded,

        normalizedRole,
        isSystemAdmin,
        isOwnerOrAdmin,
        isOwner,
        isAdmin,
        isManager,
        isEmployee,

        hasPermission,
        hasfaceallowed,

        login,
        getInfo,
        logout,
        resetToken,
        changeLocation,
        rebuildRoutes,

        isClockedIn,
        isClocked,
        activeClockSession,
        setClockedIn,
        loadClockStatus
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(
        acceptHMRUpdate(
            useUserStore,
            import.meta.hot
        )
    )
}