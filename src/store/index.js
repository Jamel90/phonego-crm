import { createStore } from 'vuex'
import { auth } from './auth.store'

export default createStore({
  modules: {
    auth
  },
  state: {
    repairs: [],
    clients: [],
    inventory: []
  },
  mutations: {
    setRepairs(state, repairs) {
      state.repairs = repairs
    },
    setClients(state, clients) {
      state.clients = clients
    },
    setInventory(state, inventory) {
      state.inventory = inventory
    }
  },
  actions: {
    // Actions will be implemented here
  },
  getters: {
    allRepairs: state => state.repairs,
    allClients: state => state.clients,
    allInventory: state => state.inventory
  }
})
