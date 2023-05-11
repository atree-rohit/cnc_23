<style></style>

<template>
    <template v-for="(value, key) in data">
        <td>{{ value }}</td>
    </template>
</template>

<script lang="js">
import {defineComponent} from 'vue'

export default defineComponent({
    name: "SuperlativeRow",
    props: ["data"]
})
</script>