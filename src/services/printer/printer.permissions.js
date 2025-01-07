import { useAuthStore } from '@/stores/auth'

export const PRINTER_PERMISSIONS = {
  CONFIGURE: 'printer.configure',
  PRINT: 'printer.print',
  VIEW_HISTORY: 'printer.view_history',
  MANAGE_ALL_PRINTERS: 'manage_all_printers', // Permission super admin
  VIEW_ALL_PRINTERS: 'view_all_printers'      // Permission super admin
}

export class PrinterPermissionsService {
  constructor() {
    this.authStore = useAuthStore()
  }

  // Vérifie si l'utilisateur peut configurer les imprimantes
  async canManagePrinters() {
    const userRole = this.authStore.userRole
    
    // L'owner, l'admin et le super admin ont tous les droits
    if (userRole === 'owner' || userRole === 'admin' || userRole === 'super_admin') {
      return true
    }

    // Le manager peut configurer les imprimantes
    if (userRole === 'manager') {
      return true
    }

    return false
  }

  // Vérifie si l'utilisateur peut imprimer
  async canPrint() {
    const userRole = this.authStore.userRole
    
    // Tous les rôles sauf 'viewer' peuvent imprimer
    return ['owner', 'admin', 'manager', 'employee', 'super_admin'].includes(userRole)
  }

  // Vérifie si l'utilisateur peut voir l'historique
  async canViewHistory() {
    const userRole = this.authStore.userRole
    
    // Owner, admin, manager et super admin peuvent voir l'historique
    return ['owner', 'admin', 'manager', 'super_admin'].includes(userRole)
  }
}

// Export d'une instance unique du service
export const printerPermissions = new PrinterPermissionsService()
