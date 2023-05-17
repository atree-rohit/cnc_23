<style scoped>
span img{
    height:2rem;
    aspect-ratio: 1/1;
    padding: .25rem;
    background-color: white;
    border-radius: 50%;
}
</style>

<template>
    <span>
        <img :src="getImageUrl()" :alt="icon" :title="icon">
    </span>
</template>

<script lang="js">
import {defineComponent} from 'vue'

export default defineComponent({
    name: "CustomIcon",
    props: ["icon"],
    methods:{
        getImageUrl(){
            return `/icons/${this.icon}.png`
        }
    }
})
</script>