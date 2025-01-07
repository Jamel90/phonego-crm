import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { darkTheme, lightTheme } from '../styles/theme'
import { VAvatar, VAvatarGroup } from 'vuetify/components'

export default createVuetify({
  components: {
    VAvatar,
    VAvatarGroup,
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
  },
  defaults: {
    VCard: {
      rounded: 'lg',
      elevation: 0,
    },
    VBtn: {
      rounded: 'pill',
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VAvatarGroup: {
      max: 3,
      size: 36,
    },
  },
})
