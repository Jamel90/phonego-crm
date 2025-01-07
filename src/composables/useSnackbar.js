import { ref } from 'vue'

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 3000
})

export function useSnackbar() {
  const showSnackbar = (text, type = 'success') => {
    let color = type
    let timeout = 3000

    switch (type) {
      case 'error':
        color = 'error'
        timeout = 5000
        break
      case 'warning':
        color = 'warning'
        timeout = 4000
        break
      case 'info':
        color = 'info'
        timeout = 3000
        break
      default:
        color = 'success'
        timeout = 3000
    }

    snackbar.value = {
      show: true,
      text,
      color,
      timeout
    }
  }

  const showSuccess = (text) => showSnackbar(text, 'success')
  const showError = (text) => showSnackbar(text, 'error')
  const showWarning = (text) => showSnackbar(text, 'warning')
  const showInfo = (text) => showSnackbar(text, 'info')

  return {
    snackbar,
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
