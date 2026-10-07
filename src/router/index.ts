
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
      icon: 'setting',
      // ONLY System Admin can see this route
      roles: ['system admin'],
      permission: 'companies.read'
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
          permission: 'companies.read',
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
          permission: 'companies.read',
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
        meta: { title: 'Customers', icon: 'peoples', noCache: true, permission: 'customers.read' }
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
        meta: { title: 'New Customer', noCache: true, hidden: true, permission: 'customers.create' }
      }
    ]
  },
  {
    path: '/customercheckin',
    component: () => import('@/views/customer/checkin/tabletcheckin'),
    name: 'CustomerCheckin',
    meta: { title: 'Check In', noCache: true, permission: 'checkin.read', roles: ['checkin'] }
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
        meta: { title: 'Check In', icon: 'peoples', noCache: true, permission: 'checkin.read', hidden: true, roles: ['employee'] }
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
        meta: { title: 'Ticket Out', icon: 'Ticket', noCache: true, permission: 'ticketout.read', roles: ['employee'] }
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
          permission: 'clock.read', roles: ['employee']
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
        meta: { title: 'Raffle', icon: 'Money', noCache: true, permission: 'clock.read' }
      },
      {
        path: 'settings',
        component: () => import('@/views/raffle/settings.vue'),
        name: 'RaffleSettings',
        meta: { title: 'Raffle Settings', hidden: true, noCache: true, permission: 'clock.read', roles: ['admin'] }
      }
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
        meta: { title: 'Time Clock', icon: 'LocationFilled', noCache: true, permission: 'clock.read' }
      }
    ]
  },
  {
    path: '/transaction',
    component: Layout,
    redirect: '/transaction',
    name: 'Transaction',
    meta: { title: 'Transaction', icon: 'Money' },
    children: [
      {
        path: '/sessiontrasaction',
        name: 'EmployeeFinance',
        component: () => import('@/views/transaction/employeetransactions.vue'),
        meta: { title: 'Transaction', noCache: true, permission: 'clock.read', roles: ['employee'] }
      },
      {
        path: '/admintransaction',
        name: 'AdminFinance',
        component: () => import('@/views/transaction/owneradmintransactions.vue'),
        meta: { title: 'Transaction', noCache: true, permission: 'employeesession.update', roles: ['owner', 'admin', 'system admin'] }
      }
    ]
  },
  {
    path: '/operation',
    component: Layout,
    redirect: 'noRedirect',
    name: 'Operation',
    meta: { title: 'Operations', icon: 'Management' },
    children: [
      {
        path: 'pointwatching',
        component: () => import('@/views/operation/pointwatching'),
        name: 'PointWatching',
        meta: { title: 'Point Watching', noCache: true, permission: 'pointwatching.read' }
      },
      {
        path: 'employee-sessions',
        component: () => import('@/views/operation/employeesession/index.vue'),
        name: 'EmployeeSessionReports',
        meta: {
          title: 'Employee Sessions',
          noCache: true,
          permission: 'employeesession.read'
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
          permission: 'employeesession.read'
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
          permission: 'employeesession.read'
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
          permission: 'employeesession.read'
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
          permission: 'employeesession.read'
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
          permission: 'employeesession.read'
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
          permission: 'employeesession.read'
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
          permission: 'employeesession.read'
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
      permissions: ['reading.read']
    },
    children: [
      {
        path: 'session',
        component: () => import('@/views/reading/recordsession'),
        name: 'ReadingSession',
        meta: {
          title: 'Record Reading', noCache: true,
          permissions: ['reading.read']
        }
      },

      {
        path: 'report',
        component: () => import('@/views/reading/report'),
        name: 'ReadingReport',
        meta: {
          title: 'Reading Reports', noCache: true,
          permissions: ['reading.read']
        }
      }
    ]
  },
  {
    path: '/report',
    component: Layout,
    redirect: 'noRedirect',
    name: 'Reports',
    meta: { title: 'Report', icon: 'chart', permission: 'reports.read' },
    children: [
      {
        path: 'overview',
        name: 'FinancialOverview',
        component: () => import('@/views/report/financialoverview.vue'),
        meta: { title: 'Financial Overview', noCache: true, hidden: true }
      },
      {
        path: 'location-cash',
        name: 'LocationCashLedger',
        component: () => import('@/views/report/locationcashledger.vue'),
        meta: { title: 'Location Ledger', noCache: true, hidden: true }
      },
      {
        path: 'weeklyreport',
        component: () => import('@/views/report/weeklyreport'),
        name: 'WeeklyReport',
        meta: { title: 'Weekly Report', noCache: true, permission: 'reports.read' }
      },
      // {
      //     path: 'monthlyreport',
      //     component: () => import('@/views/report/monthlyreport'),
      //     name: 'MonthlyReport',
      //     meta: { title: 'Monthly Report', noCache: true, permission: 'reports.read' },
      // },
      {
        path: 'session-cash-report',
        name: 'SessionCashHistoryReport',
        component: () => import('@/views/report/sessioncashhistoryreport.vue'),
        meta: { title: 'Session Cash Report', noCache: true, hidden: true }
      },
      {
        path: 'money-trail-report',
        name: 'MoneyTrailReport',
        component: () => import('@/views/report/moneytrailreport.vue'),
        meta: {
          title: 'Money Trail Report', noCache: true, hidden: true
        }
      }

    ]
  },
  {
    path: '/settings',
    component: Layout,
    redirect: 'noRedirect',
    name: 'Settings',
    meta: { title: 'Settings', icon: 'Tools' },
    children: [
      {
        path: 'users',
        component: () => import('@/views/settings/users/index.vue'),
        name: 'Users',
        meta: { title: 'Users', noCache: true, permission: 'users.read' }
      },
      {
        path: 'roles',
        component: () => import('@/views/settings/roles/index.vue'),
        name: 'RolesPermissions',
        meta: { title: 'Roles & Permissions', noCache: true, permission: 'roles.read' }
      },
      {
        path: 'machines',
        component: () => import('@/views/settings/machine/index'),
        name: 'Machines',
        meta: { title: 'Machines Setup', noCache: true, permission: 'machinesetup.read' }
      },
      {
        path: 'bonus',
        name: 'BonusManagement',
        component: () => import('@/views/settings/bonus/index.vue'),
        meta: { title: 'Bonus Management', noCache: true, permission: 'bonus.read' }
      },
      {
        path: 'bonus/create',
        name: 'BonusCreate',
        component: () => import('@/views/settings/bonus/edit.vue'),
        meta: { title: 'Create Bonus', noCache: true, hidden: true, permission: 'bonus.create' }
      },
      {
        path: 'bonus/edit/:id',
        name: 'BonusEdit',
        component: () => import('@/views/settings/bonus/edit.vue'),
        meta: { title: 'Edit Bonus', noCache: true, hidden: true, permission: 'bonus.update' }
      },
      {
        path: 'manage-rules',
        name: 'ManageRules',
        component: () => import('@/views/settings/managerules/index.vue'),
        meta: { title: 'Manage Rules', noCache: true, permission: 'managerules.read' }
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
      permissions: ['promotion.read'],
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
          permissions: ['promotion.template.read']
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
          permissions: ['promotion.template.create']
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
          permissions: ['promotion.template.update']
        }
      },
      {
        path: '',
        component: () =>
          import('@/views/promotion/index.vue'),
        name: 'PromotionList',
        meta: {
          title: 'Promotions',
          permissions: ['promotion.read']
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
          permissions: ['promotion.create']
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
          permissions: ['promotion.read']
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
