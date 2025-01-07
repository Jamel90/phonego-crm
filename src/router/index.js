import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/constants/plans'
import { authGuard } from './guards/auth.guard'
import { subscriptionGuard } from './guards/subscription.guard'
import { adminGuard } from './guards/admin.guard'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: () => import('@/views/Landing.vue'),
    meta: {
      requiresAuth: false,
      hideForAuth: true
    }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/Login.vue'),
    meta: {
      requiresAuth: false,
      hideForAuth: true
    }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/Register.vue'),
    meta: {
      requiresAuth: false,
      hideForAuth: true
    }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/repairs',
    name: 'repairs',
    component: () => import('@/views/Repairs.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/repairs/new',
    name: 'repairs.new',
    component: () => import('@/views/repairs/NewRepair.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/repairs/:id',
    name: 'repairs.edit',
    component: () => import('@/views/repairs/EditRepair.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/clients',
    name: 'clients',
    component: () => import('@/views/Clients.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/clients/new',
    name: 'clients.new',
    component: () => import('@/views/clients/NewClient.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/views/Inventory.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: () => import('@/views/Pricing.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    component: () => import('@/views/settings/Settings.vue'),
    meta: {
      requiresAuth: true,
      title: 'Paramètres'
    },
    children: [
      {
        path: '',
        name: 'settings.general',
        component: () => import('@/views/settings/GeneralSettings.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'store',
        name: 'settings.store',
        component: () => import('@/views/settings/StoreSettings.vue'),
        meta: {
          requiresAuth: true,
          roles: [ROLES.OWNER, ROLES.ADMIN]
        }
      },
      {
        path: 'user',
        name: 'settings.user',
        component: () => import('@/views/settings/UserSettings.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'printers',
        name: 'settings.printers',
        component: () => import('@/views/settings/PrinterSettings.vue'),
        meta: {
          requiresAuth: true,
          roles: [ROLES.OWNER, ROLES.ADMIN]
        }
      },
      {
        path: 'manufacturers',
        name: 'settings.manufacturers',
        component: () => import('@/views/settings/ManufacturersSettings.vue'),
        meta: {
          requiresAuth: true,
          roles: [ROLES.OWNER, ROLES.ADMIN]
        }
      },
      {
        path: 'repair-issues',
        name: 'settings.repair-issues',
        component: () => import('@/views/settings/RepairIssuesSettings.vue'),
        meta: {
          requiresAuth: true,
          roles: [ROLES.OWNER, ROLES.ADMIN]
        }
      }
    ]
  },
  {
    path: '/subscription',
    name: 'subscription',
    component: () => import('@/views/Subscription.vue'),
    meta: {
      requiresAuth: true,
      roles: [ROLES.OWNER, ROLES.ADMIN]
    }
  },
  {
    path: '/billing',
    name: 'billing',
    component: () => import('@/views/Billing.vue'),
    meta: {
      requiresAuth: true,
      roles: [ROLES.OWNER, ROLES.ADMIN]
    }
  },
  {
    path: '/billing/success',
    name: 'billing.success',
    component: () => import('@/views/billing/Success.vue'),
    meta: {
      requiresAuth: true,
      roles: [ROLES.OWNER, ROLES.ADMIN]
    }
  },
  {
    path: '/billing/cancel',
    name: 'billing.cancel',
    component: () => import('@/views/billing/Cancel.vue'),
    meta: {
      requiresAuth: true,
      roles: [ROLES.OWNER, ROLES.ADMIN]
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: {
      requiresAuth: true,
      requiresSuperAdmin: true,
      title: 'Administration SaaS'
    },
    children: [
      {
        path: '',
        name: 'admin.dashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true
        }
      },
      {
        path: 'stores',
        name: 'admin.stores',
        component: () => import('@/views/admin/Stores.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true
        }
      },
      {
        path: 'users',
        name: 'admin.users',
        component: () => import('@/views/admin/Users.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true
        }
      },
      {
        path: 'printers',
        name: 'admin.printers',
        component: () => import('@/views/admin/PrinterManagement.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true
        }
      },
      {
        path: 'analytics',
        name: 'admin.analytics',
        component: () => import('@/views/admin/Analytics.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true
        }
      },
      {
        path: 'plans',
        name: 'admin.plans',
        component: () => import('@/views/admin/PlansManager.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: 'Gestion des Plans'
        }
      },
      {
        path: 'promotions',
        name: 'admin.promotions',
        component: () => import('@/views/admin/Promotions.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true
        }
      },
      {
        path: 'invoices',
        name: 'admin.invoices',
        component: () => import('@/views/admin/Invoices.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true
        }
      },
      {
        path: 'notifications',
        name: 'admin.notifications',
        component: () => import('@/views/admin/Notifications.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true
        }
      },
      {
        path: 'users-plans',
        name: 'admin.users-plans',
        component: () => import('@/views/admin/UsersPlans.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: 'Plans des Utilisateurs'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  const isAuthenticated = auth.isAuthenticated

  // Redirect authenticated users trying to access auth pages
  if (isAuthenticated && to.meta.hideForAuth) {
    next({ name: 'dashboard' })
    return
  }

  // Redirect unauthenticated users trying to access protected pages
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
    return
  }

  // Check admin access
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    next({ name: 'dashboard' })
    return
  }

  // Check super admin access
  if (to.meta.requiresSuperAdmin && !auth.isSuperAdmin) {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export default router
