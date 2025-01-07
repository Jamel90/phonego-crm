export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: import.meta.env.VITE_STRIPE_MONTHLY_PRODUCT_ID,
    priceId: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID,
    name: 'Mensuel',
    price: 59,
    interval: 'mois',
    billingCycle: 'mois',
    maxUsers: 5,
    maxClients: 500,
    maxRepairs: 1000,
    features: [
      'Gestion illimitée des réparations',
      'Suivi des clients',
      'Notifications SMS & Email',
      'Tableau de bord analytique',
      'Support client prioritaire',
      'Sauvegarde automatique'
    ]
  },
  yearly: {
    id: import.meta.env.VITE_STRIPE_YEARLY_PRODUCT_ID,
    priceId: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID,
    name: 'Annuel',
    price: 590,
    interval: 'an',
    billingCycle: 'an',
    maxUsers: 10,
    maxClients: 1000,
    maxRepairs: 2000,
    features: [
      'Toutes les fonctionnalités du plan mensuel',
      'Deux mois gratuits',
      'Formation personnalisée',
      'API pour intégrations personnalisées',
      'Support téléphonique dédié',
      'Rapport mensuel personnalisé'
    ]
  }
}

export const ROLES = {
  SUPER_ADMIN: 'super_admin',     // Administrateur PhoneGO (peut gérer tous les comptes)
  OWNER: 'owner',                 // Propriétaire d'un compte client
  ADMIN: 'admin',                 // Administrateur d'un compte client
  MANAGER: 'manager',             // Manager d'une boutique
  TECHNICIAN: 'technician',       // Technicien
  RECEPTION: 'reception'          // Réceptionniste
}

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    canManageSubscriptions: true,
    canManageAllAccounts: true,
    canAccessBilling: true,
    canManageRoles: true,
    canAccessAllShops: true,
    canAccessMetrics: true,
    canManageSettings: true
  },
  [ROLES.OWNER]: {
    canManageSubscription: true,
    canManageUsers: true,
    canAccessBilling: true,
    canManageRoles: true,
    canAccessAllShops: true,
    canAccessMetrics: true,
    canManageSettings: true
  },
  [ROLES.ADMIN]: {
    canManageUsers: true,
    canManageRoles: ['manager', 'technician', 'reception'],
    canAccessAllShops: true,
    canAccessMetrics: true,
    canManageSettings: true
  },
  [ROLES.MANAGER]: {
    canManageShop: true,
    canManageInventory: true,
    canManageRepairs: true,
    canManageClients: true,
    canAccessMetrics: ['shop'],
    canManageRoles: ['technician', 'reception']
  },
  [ROLES.TECHNICIAN]: {
    canManageRepairs: true,
    canViewClients: true,
    canViewInventory: true,
    canUpdateRepairStatus: true
  },
  [ROLES.RECEPTION]: {
    canCreateRepairs: true,
    canManageClients: true,
    canViewInventory: true,
    canUpdateRepairStatus: ['created', 'waiting_parts']
  }
}
