<style scoped>
.custom-row{
    display: flex;
    justify-content: space-around;
}
.custom-row div{
    margin: auto;
}
</style>

<template>
    <tr :class="row_class" v-for="(value, key) in data" :key="key">
        <td class="custom-row">
            <custom-icon :icon="icon_url" />
            <div class="label" v-text="label" />
            <div class="category" v-text="format_text(key)"/>
        </td>
        <superlative-row :data="value" />
    </tr>
</template>

<script lang="js">
import {defineComponent} from 'vue'
import SuperlativeRow from './SuperlativeRow.vue'
import CustomIcon from './CustomIcon.vue'

export default defineComponent({
  name: 'SuperlativeMultipleRows',
  components: {
    SuperlativeRow,
    CustomIcon
  },
  props: ["data", "row_class", "label", "icon"],
  computed:{
    icon_url(){
        let op = ""
        if(this.icon){
            op = this.icon.toLowerCase()
        }
        return op
    }
  },
  methods:{
    format_text(text){
      return this.capatilize_words(text.replace(/_/g, " "))
    },
    capatilize_words(text){
        return text.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }
  }
})
</script>