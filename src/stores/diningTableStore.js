import { defineStore } from 'pinia'
import tableService from '@/api/table'

export const useDiningTableStore = defineStore('diningTable', {
  state: () => ({
    tables: []
  }),

  actions: {
    async fetchTables(params = {}) {
      const res = await tableService.getAllTables(params)      
      this.tables = res.data.data.data
    }
  }
})
