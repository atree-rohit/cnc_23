<template>
  <DistrictWiseStats />
</template>

<script lang="ts">
  import { defineComponent } from 'vue'
  import ReadCSV from './components/ReadCSV.vue'
  import DistrictWiseStats from './components/DistrictWiseStats.vue'
  import store from './store'

  export default defineComponent({
    name: "App",
    components: {
      ReadCSV,
      DistrictWiseStats
    },
    mounted(){
      store.dispatch('initLocationGroups')
      store.dispatch('computeSuperlatives')
    }
  })
</script>