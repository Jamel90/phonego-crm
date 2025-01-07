&lt;template&gt;
  &lt;v-container fluid&gt;
    &lt;v-row class="mb-4"&gt;
      &lt;v-col cols="12" sm="8"&gt;
        &lt;h1 class="text-h4 font-weight-bold"&gt;Gestion des problèmes&lt;/h1&gt;
      &lt;/v-col&gt;
      &lt;v-col cols="12" sm="4" class="text-right"&gt;
        &lt;v-btn
          color="primary"
          @click="openDialog()"
        &gt;
          Ajouter un problème
        &lt;/v-btn&gt;
      &lt;/v-col&gt;
    &lt;/v-row&gt;

    &lt;v-card&gt;
      &lt;v-data-table
        :headers="headers"
        :items="issues"
        :loading="loading"
        class="elevation-1"
      &gt;
        &lt;template v-slot:item.actions="{ item }"&gt;
          &lt;v-btn
            icon
            variant="text"
            @click="openDialog(item.raw)"
          &gt;
            &lt;v-icon&gt;mdi-pencil&lt;/v-icon&gt;
          &lt;/v-btn&gt;
        &lt;/template&gt;
      &lt;/v-data-table&gt;
    &lt;/v-card&gt;

    &lt;v-dialog
      v-model="dialog.show"
      max-width="600px"
    &gt;
      &lt;v-card&gt;
        &lt;v-card-title class="text-h5 pa-4"&gt;
          {{ dialog.isEdit ? 'Modifier le problème' : 'Nouveau problème' }}
        &lt;/v-card-title&gt;

        &lt;v-card-text class="pa-4"&gt;
          &lt;v-form ref="form" @submit.prevent="saveIssue"&gt;
            &lt;v-row&gt;
              &lt;v-col cols="12"&gt;
                &lt;v-text-field
                  v-model="dialog.issue.name"
                  label="Nom du problème"
                  required
                  variant="outlined"
                  density="comfortable"
                /&gt;
              &lt;/v-col&gt;

              &lt;v-col cols="12" md="6"&gt;
                &lt;v-text-field
                  v-model.number="dialog.issue.price"
                  label="Prix"
                  type="number"
                  prefix="€"
                  required
                  variant="outlined"
                  density="comfortable"
                /&gt;
              &lt;/v-col&gt;

              &lt;v-col cols="12" md="6"&gt;
                &lt;v-text-field
                  v-model.number="dialog.issue.estimatedTime"
                  label="Temps estimé"
                  type="number"
                  suffix="h"
                  required
                  variant="outlined"
                  density="comfortable"
                /&gt;
              &lt;/v-col&gt;

              &lt;v-col cols="12"&gt;
                &lt;v-autocomplete
                  v-model="dialog.issue.manufacturerId"
                  :items="manufacturers"
                  item-title="name"
                  item-value="id"
                  label="Fabricant"
                  required
                  variant="outlined"
                  density="comfortable"
                /&gt;
              &lt;/v-col&gt;

              &lt;v-col cols="12"&gt;
                &lt;v-textarea
                  v-model="dialog.issue.description"
                  label="Description"
                  variant="outlined"
                  density="comfortable"
                /&gt;
              &lt;/v-col&gt;
            &lt;/v-row&gt;
          &lt;/v-form&gt;
        &lt;/v-card-text&gt;

        &lt;v-card-actions class="pa-4"&gt;
          &lt;v-spacer /&gt;
          &lt;v-btn
            variant="text"
            @click="closeDialog"
          &gt;
            Annuler
          &lt;/v-btn&gt;
          &lt;v-btn
            color="primary"
            @click="saveIssue"
          &gt;
            {{ dialog.isEdit ? 'Modifier' : 'Créer' }}
          &lt;/v-btn&gt;
        &lt;/v-card-actions&gt;
      &lt;/v-card&gt;
    &lt;/v-dialog&gt;
  &lt;/v-container&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref, onMounted } from 'vue'
import { useRepairStore } from '@/stores/repair'
import { useManufacturerStore } from '@/stores/manufacturer'

const repairStore = useRepairStore()
const manufacturerStore = useManufacturerStore()

const loading = ref(false)
const issues = ref([])
const manufacturers = ref([])
const form = ref(null)

const headers = ref([
  { title: 'Nom', key: 'name' },
  { title: 'Prix', key: 'price' },
  { title: 'Temps estimé', key: 'estimatedTime' },
  { title: 'Actions', key: 'actions', sortable: false }
])

const dialog = ref({
  show: false,
  isEdit: false,
  issue: {
    name: '',
    price: 0,
    estimatedTime: 0,
    manufacturerId: '',
    description: ''
  }
})

const openDialog = (issue = null) => {
  dialog.value.isEdit = !!issue
  dialog.value.issue = issue ? { ...issue } : {
    name: '',
    price: 0,
    estimatedTime: 0,
    manufacturerId: '',
    description: ''
  }
  dialog.value.show = true
}

const closeDialog = () => {
  dialog.value.show = false
  dialog.value.isEdit = false
  dialog.value.issue = {
    name: '',
    price: 0,
    estimatedTime: 0,
    manufacturerId: '',
    description: ''
  }
  if (form.value) {
    form.value.reset()
  }
}

const saveIssue = async () => {
  if (!dialog.value.issue.name || !dialog.value.issue.manufacturerId) {
    return
  }

  try {
    if (dialog.value.isEdit) {
      // TODO: Implement update
    } else {
      await repairStore.createIssue(dialog.value.issue)
    }
    closeDialog()
    await fetchData()
  } catch (error) {
    console.error('Error saving issue:', error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    await Promise.all([
      manufacturerStore.fetchManufacturers(),
      repairStore.fetchIssues()
    ])
    manufacturers.value = manufacturerStore.manufacturers
    issues.value = repairStore.issues
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
&lt;/script&gt;
