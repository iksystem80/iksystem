
import { createRouter, createWebHashHistory } from 'vue-router';
import type { Router, RouteRecordRaw, RouteComponent } from 'vue-router';

const Layout = (): RouteComponent => import('@/layout/index.vue');

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/redirect',
    component: Layout,
    meta: { hidden: true },
    children: [{ path: '/redirect/:path(.*)', component: () => import('@/views/redirect/index.vue') }]
  },
  { path: '/login', component: () => import('@/views/login/index.vue'), meta: { hidden: true }},
  { path: '/auth-redirect', component: () => import('@/views/login/auth-redirect.vue'), meta: { hidden: true }},
  // { path: '/404', component: () => import('@/views/error-page/404.vue'), meta: { hidden: true } },
  // { path: '/401', component: () => import('@/views/error-page/401.vue'), meta: { hidden: true } },
  {
    path: '/404',
    component: Layout,
    meta: { hidden: true },
    children: [{ path: '/404', component: () => import('@/views/error-page/404.vue') }]
  },
  {
    path: '/401',
    component: Layout,
    meta: { hidden: true },
    children: [{ path: '/401', component: () => import('@/views/error-page/401.vue') }]
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        name: 'Dashboard',
        meta: { title: 'Dashboard', icon: 'dashboard', affix: true, noCache: true }
      }
    ]
  }
];

export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/system',
    component: Layout,
    redirect: '/system/companies',

    meta: {
      title: 'System Administration',
      icon: 'dashboard',
      // ONLY System Admin can see this route
      roles: ['system admin'],
      permission: 'system'
    },

    children: [
      {
        path: 'companies',
        name: 'Companies',
        component: () =>
          import('@/views/company/index.vue'),
        meta: {
          title: 'Companies',
          icon: 'office-building',
          permission: 'system.companies',
          roles: ['system admin']
        }
      },
      {
        path: 'companies/:companyId',
        name: 'CompanyDetail',
        component: () =>
          import('@/views/company/detail.vue'),
        meta: {
          hidden: true,
          title: 'Company',
          permission: 'system.companies',
          roles: ['system admin']
        }
      },
      {
        path: 'module-assignment',
        name: 'SystemModuleAssignment',
        component: () =>
          import('@/views/system/moduleassignment/index.vue'),
        meta: {
          title: 'Module Assignment',
          icon: 'setting',
          permission: 'system',
          roles: ['system admin']
        }
      }
    ]
  },
  {
    path: '/customer',
    component: Layout,
    redirect: '/customer/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/customer/index'),
        name: 'Customers',
        meta: { title: 'Customers', icon: 'peoples', noCache: true, permission: 'customers' }
      }
    ]
  },
  {
    path: '/newcustomer',
    component: Layout,
    redirect: '/newcustomer/index',
    meta: { hidden: true },
    children: [
      {
        path: 'index',
        component: () => import('@/views/customer/newcustomer/index'),
        name: 'NewCustomer',
        meta: { title: 'New Customer', noCache: true, hidden: true, permission: 'customers' }
      }
    ]
  },
  {
    path: '/customercheckin',
    component: () => import('@/views/customer/checkin/tabletcheckin'),
    name: 'CustomerCheckin',
    meta: { title: 'Check In', noCache: true, permission: 'checkin', roles: ['checkin'] }
  },
  {
    path: '/checkin',
    component: Layout,
    redirect: '/checkin/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/customer/checkin/index'),
        name: 'CheckIn',
        meta: { title: 'Check In', icon: 'peoples', noCache: true, permission: 'checkin', hidden: true, roles: ['employee'] }
      }
    ]
  },
  {
    path: '/ticketout',
    component: Layout,
    redirect: '/ticketout/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/ticket/index'),
        name: 'TicketOut',
        meta: { title: 'Ticket Out', icon: 'Ticket', noCache: true, permission: 'ticketout', roles: ['employee'] }
      }
    ]
  },
  {
    path: '/bonus',
    component: Layout,
    redirect: '/bonus/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/bonus/index.vue'),
        name: 'BonusGive',
        meta: {
          title: 'Bonus',
          icon: 'Money',
          noCache: true,
          permission: 'bonus',
          roles: ['employee']
        }
      }
    ]
  },
  {
    path: '/luckybird',
    component: Layout,
    redirect: '/luckybird/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/luckybird/index.vue'),
        name: 'LuckyBird',
        meta: {
          title: 'Lucky Bird',
          icon: 'Money',
          noCache: true,
          permission: 'luckybird',
          roles: ['employee']
        }
      }
    ]
  },
  {
    path: '/raffle',
    component: Layout,
    redirect: '/raffle/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/raffle/index.vue'),
        name: 'Raffle',
        meta: { title: 'Raffle', icon: 'Money', noCache: true, permission: 'raffle', roles: ['employee'] }
      }
      //, {
      //   path: 'settings',
      //   component: () => import('@/views/raffle/settings.vue'),
      //   name: 'RaffleSettings',
      //   meta: { title: 'Raffle Settings', icon: 'Money', noCache: true, permission: 'clock.read', roles: ['admin'] }
      // }
    ]
  },

  {
    path: '/clock',
    component: Layout,
    redirect: '/clock/index',
    meta: { hidden: true },
    children: [
      {
        path: 'index',
        component: () => import('@/views/clock/index'),
        name: 'EmployeeClock',
        meta: { title: 'Time Clock', icon: 'LocationFilled', noCache: true, permission: 'clock' }
      }
    ]
  },
  {
    path: '/transaction',
    component: Layout,
    redirect: '/transaction',
    name: 'Transaction',
    meta: { title: 'Transaction', icon: 'Money', permission: 'transaction' },
    children: [
      {
        path: '/sessiontrasaction',
        name: 'EmployeeFinance',
        component: () => import('@/views/transaction/employeetransactions.vue'),
        meta: { title: 'Transaction', noCache: true, permission: 'transaction.employee', roles: ['employee'] }
      },
      {
        path: '/admintransaction',
        name: 'AdminFinance',
        component: () => import('@/views/transaction/owneradmintransactions.vue'),
        meta: { title: 'Transaction', noCache: true, permission: 'transaction.admin', roles: ['owner', 'admin', 'system admin'] }
      }
    ]
  },
  {
    path: '/operation',
    component: Layout,
    redirect: 'noRedirect',
    name: 'Operation',
    meta: { title: 'Operations', icon: 'Management', permission: 'operations' },
    children: [
      {
        path: 'pointwatching',
        component: () => import('@/views/operation/pointwatching'),
        name: 'PointWatching',
        meta: { title: 'Point Watching', noCache: true, permission: 'operations.pointwatching' }
      },
      {
        path: 'employee-sessions',
        component: () => import('@/views/operation/employeesession/index.vue'),
        name: 'EmployeeSessionReports',
        meta: {
          title: 'Employee Sessions',
          noCache: true,
          permission: 'operations.employee-sessions'
        }
      },
      {
        path: 'employee-sessions/:employeeId',
        component: () => import('@/views/operation/employeesession/sessions.vue'),
        name: 'EmployeeSessionList',
        meta: {
          title: 'Employee Sessions',
          hidden: true,
          noCache: true,
          permission: 'operations.employee-sessions'
        }
      },
      {
        path: 'employee-sessions/:employeeId/session/:sessionId',
        component: () => import('@/views/operation/employeesession/sessionreports.vue'),
        name: 'EmployeeSessionReportMenu',
        meta: {
          title: 'Session Reports',
          hidden: true,
          noCache: true,
          permission: 'operations.employee-sessions'
        }
      },
      {
        path: 'employee-sessions/:employeeId/session/:sessionId/points',
        component: () => import('@/views/operation/employeesession/pointsreport.vue'),
        name: 'EmployeeSessionPointsReport',
        meta: {
          title: 'Points Report',
          hidden: true,
          noCache: true,
          permission: 'operations.employee-sessions'
        }
      },
      {
        path: 'employee-sessions/:employeeId/session/:sessionId/shift',
        component: () => import('@/views/operation/employeesession/shiftreport.vue'),
        name: 'EmployeeSessionShiftReport',
        meta: {
          title: 'Shift Report',
          hidden: true,
          noCache: true,
          permission: 'operations.employee-sessions'
        }
      },
      {
        path: 'employee-sessions/:employeeId/session/:sessionId/ticket-out',
        component: () => import('@/views/operation/employeesession/ticketoutreport.vue'),
        name: 'EmployeeSessionTicketOutReport',
        meta: {
          title: 'Ticket Out Report',
          hidden: true,
          noCache: true,
          permission: 'operations.employee-sessions'
        }
      },
      {
        path: 'employee-sessions/:employeeId/session/:sessionId/raffle',
        component: () => import('@/views/operation/employeesession/rafflereport.vue'),
        name: 'EmployeeSessionRaffleReport',
        meta: {
          title: 'Raffle Report',
          hidden: true,
          noCache: true,
          permission: 'operations.employee-sessions'
        }
      },
      {
        path: 'employee-sessions/:employeeId/session/:sessionId/bonus',
        component: () => import('@/views/operation/employeesession/bonusreport.vue'),
        name: 'EmployeeSessionBonusReport',
        meta: {
          title: 'Bonus Report',
          hidden: true,
          noCache: true,
          permission: 'operations.employee-sessions'
        }
      },
      {
        path: 'employee-sessions/:employeeId/session/:sessionId/lucky-bird',
        component: () => import('@/views/operation/employeesession/luckybirdreport.vue'),
        name: 'EmployeeSessionLuckyBirdReport',
        meta: {
          title: 'Lucky Bird Report',
          hidden: true,
          noCache: true,
          permission: 'operations.employee-sessions'
        }
      }
    ]
  },
  {
    path: '/reading',
    component: Layout,
    redirect: '/reading/session',
    name: 'Reading',
    meta: {
      title: 'Readings',
      icon: 'form',
      permission: 'reading'
    },
    children: [
      {
        path: 'session',
        component: () => import('@/views/reading/recordsession'),
        name: 'ReadingSession',
        meta: {
          title: 'Record Reading', noCache: true,
          permission: 'reading.record'
        }
      },

      {
        path: 'report',
        component: () => import('@/views/reading/report'),
        name: 'ReadingReport',
        meta: {
          title: 'Reading Reports', noCache: true,
          permission: 'reading.reports'
        }
      }
    ]
  },
  {
    path: '/report',
    component: Layout,
    redirect: 'noRedirect',
    name: 'Reports',
    meta: { title: 'Report', icon: 'chart', permission: 'reports' },
    children: [
      {
        path: 'weeklyreport',
        component: () => import('@/views/report/weeklyreport'),
        name: 'WeeklyReport',
        meta: { title: 'Weekly Report', noCache: true, permission: 'reports.weekly' }
       }
    ]
  },
  {
    path: '/settings',
    component: Layout,
    redirect: 'noRedirect',
    name: 'Settings',
    meta: { title: 'Settings', icon: 'Tools', permission: 'settings' },
    children: [
      {
        path: 'users',
        component: () => import('@/views/settings/users/index.vue'),
        name: 'Users',
        meta: { title: 'Users', noCache: true, permission: 'settings.users' }
      },
      {
        path: 'roles',
        component: () => import('@/views/settings/roles/index.vue'),
        name: 'RolesPermissions',
        meta: { title: 'Roles & Permissions', noCache: true, permission: 'settings.roles' }
      },
      {
        path: 'machines',
        component: () => import('@/views/settings/machine/index'),
        name: 'Machines',
        meta: { title: 'Machines Setup', noCache: true, permission: 'settings.machines' }
      },
      {
        path: 'bonus',
        name: 'BonusManagement',
        component: () => import('@/views/settings/bonus/index.vue'),
        meta: { title: 'Bonus Management', noCache: true, permission: 'settings.bonus' }
      },
      {
        path: 'bonus/create',
        name: 'BonusCreate',
        component: () => import('@/views/settings/bonus/edit.vue'),
        meta: { title: 'Create Bonus', noCache: true, hidden: true, permission: 'settings.bonus' }
      },
      {
        path: 'bonus/edit/:id',
        name: 'BonusEdit',
        component: () => import('@/views/settings/bonus/edit.vue'),
        meta: { title: 'Edit Bonus', noCache: true, hidden: true, permission: 'settings.bonus' }
      },
      {
        path: 'rafflesettings',
        component: () => import('@/views/raffle/settings.vue'),
        name: 'RaffleSettings',
        meta: { title: 'Raffle Settings',noCache: true, permission: 'settings.raffle' }
      },
      {
        path: 'manage-rules',
        name: 'ManageRules',
        component: () => import('@/views/settings/managerules/index.vue'),
        meta: { title: 'Manage Rules', noCache: true, permission: 'settings.manage-rules' }
      }
    ]
  },
  {
    path: '/promotion',
    component: Layout,
    redirect: '/promotion/templates',
    name: 'Promotion',
    meta: {
      title: 'Promotions',
      permission: 'promotions',
      icon: 'Promotion'
    },
    children: [
      {
        path: 'templates',
        component: () =>
          import('@/views/promotion/templates/index.vue'),
        name: 'PromotionTemplates',
        meta: {
          title: 'Templates',
          permission: 'promotions.templates'
        }
      },
      {
        path: 'templates/create',
        component: () =>
          import('@/views/promotion/templates/editor.vue'),
        name: 'PromotionTemplateCreate',
        meta: {
          hidden: true,
          title: 'Create Template',
          permission: 'promotions.templates'
        }
      },
      {
        path: 'templates/:id/edit',
        component: () =>
          import('@/views/promotion/templates/editor.vue'),
        name: 'PromotionTemplateEdit',
        meta: {
          hidden: true,
          title: 'Edit Template',
          permission: 'promotions.templates'
        }
      },
      {
        path: '',
        component: () =>
          import('@/views/promotion/index.vue'),
        name: 'PromotionList',
        meta: {
          title: 'Promotions',
          permission: 'promotions.list'
        }
      },
      {
        path: 'create',
        component: () =>
          import('@/views/promotion/create.vue'),
        name: 'PromotionCreate',
        meta: {
          hidden: true,
          title: 'Create Promotion',
          permission: 'promotions.list'
        }
      },
      {
        path: ':id',
        component: () =>
          import('@/views/promotion/detail.vue'),
        name: 'PromotionDetail',
        meta: {
          hidden: true,
          title: 'Promotion Details',
          permission: 'promotions.list'
        }
      }
    ]
  },
  {
    path: '/profile',
    component: Layout,
    redirect: '/profile/index',
    meta: { hidden: true },
    children: [
      {
        path: 'index/:id',
        component: () => import('@/views/profile/index.vue'),
        name: 'Profile',
        meta: { title: 'Profile', icon: 'user', noCache: true }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/404', meta: { hidden: true }}
];

const createTheRouter = (): Router => createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: constantRoutes
});

interface RouterPro extends Router { matcher: unknown }

const router = createTheRouter() as RouterPro;

export function resetRouter() {
  const constantNames = new Set(
    createTheRouter()
      .getRoutes()
      .map(route => route.name)
      .filter(Boolean)
  );

  router.getRoutes().forEach(route => {
    if (route.name && !constantNames.has(route.name)) {
      router.removeRoute(route.name);
    }
  });
}

export default router;
