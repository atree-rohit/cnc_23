<style>
  .switcher{
    display: flex;
    justify-content: center;
    margin: 0.5rem;
  }
  .switcher .btn{
    font-size: 1.25rem;
    padding: .5rem 1rem;
  }

  .switcher .btn.selected{
    background-color:green;
  }

  .switcher .btn:first-child{
    border-radius: 5rem 0 0 5rem;
  }

  .switcher .btn:last-child{
    border-radius: 0 5rem 5rem 0;
  }
  footer{
    text-align: center;
    padding: 0.5rem;
  }
</style>

<template>
  <div class="switcher">
    <button
      class="btn"
      v-for="m in modes"
      :key="m"
      :class="{'selected': m === mode}"
      @click="mode = m"
      v-text="m"
    />
  </div>
  <Superlatives v-if="mode=='table'" />
  <Map v-else />
  <footer>
    Data Downloaded on {{ data_download_date }}
  </footer>
</template>

<script lang="js">
  import { defineComponent } from 'vue'
  import ReadCSV from './components/ReadCSV.vue'
  import DistrictWiseStats from './components/DistrictWiseStats.vue'
  import Superlatives from './components/Superlatives.vue'
  import Map from './components/Map.vue'
  import store from './store'
  import { mapState } from 'vuex'

  export default defineComponent({
    name: "App",
    components: {
      ReadCSV,
      DistrictWiseStats,
      Superlatives,
      Map,
    },
    data(){
      return {
        modes: ['table', 'map'],
        mode: 'map',
      }
    },
    computed:{
      ...mapState(['data_download_date']),
    },
    mounted(){
      store.dispatch('initLocationGroups')
      store.dispatch('computeSuperlatives')
    }
  })
</script>