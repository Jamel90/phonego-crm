import { ref } from 'vue'

export function useNotification() {
  const notification = ref({
    show: false,
    message: '',
    color: 'success',
    timeout: 3000
  })

  function showNotification(message, options = {}) {
    notification.value = {
      show: true,
      message,
      color: options.color || 'success',
      timeout: options.timeout || 3000
    }
  }

  function showSuccess(message, timeout) {
    showNotification(message, { color: 'success', timeout })
  }

  function showError(message, timeout) {
    showNotification(message, { color: 'error', timeout })
  }

  function showWarning(message, timeout) {
    showNotification(message, { color: 'warning', timeout })
  }

  function showInfo(message, timeout) {
    showNotification(message, { color: 'info', timeout })
  }

  function hideNotification() {
    notification.value.show = false
  }

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification
  }
}
