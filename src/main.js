import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './styles/theme.css'
import VChart from 'vue-echarts'
import './plugins/echarts'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#1a1b23',
          surface: '#2a2b35',
          'surface-variant': '#2f3042',
          primary: '#4ade80',
          secondary: '#e9deff',
          accent: '#ffd84d',
          error: '#ef4444',
          info: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b'
        }
      },
      light: {
        dark: false,
        colors: {
          background: '#f8fafc',
          surface: '#ffffff',
          'surface-variant': '#f1f5f9',
          primary: '#4ade80',
          secondary: '#e9deff',
          accent: '#ffd84d',
          error: '#ef4444',
          info: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b'
        }
      }
    }
  },
  defaults: {
    VCard: {
      elevation: 1,
      rounded: 'lg'
    },
    VBtn: {
      variant: 'flat',
      rounded: 'lg'
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary'
    },
    VList: {
      elevation: 2,
      rounded: 'lg'
    },
    VAvatar: {
      rounded: 'lg'
    }
  }
})

const pinia = createPinia()
const app = createApp(App)
app.component('v-chart', VChart)
app.use(pinia)
app.use(router)
app.use(vuetify)

app.mount('#app')
