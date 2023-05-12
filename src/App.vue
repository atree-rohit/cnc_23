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
</template>

<script lang="js">
  import { defineComponent } from 'vue'
  import ReadCSV from './components/ReadCSV.vue'
  import DistrictWiseStats from './components/DistrictWiseStats.vue'
  import Superlatives from './components/Superlatives.vue'
  import Map from './components/Map.vue'
  import store from './store'

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
    mounted(){
      store.dispatch('initLocationGroups')
      store.dispatch('computeSuperlatives')
    }
  })
</script>