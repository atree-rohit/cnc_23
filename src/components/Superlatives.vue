<style>
.table-container{
    padding:1rem;
}
.table{
    width:100%;
    background-color: white;
    color: black;
    border-collapse: collapse;
    margin: 1rem 0;
}
.table td, th{
    padding: .125rem;
}

.table th{
    background: black;
    color: white;
    font-size: 1.75rem;
}
.region-row{
    font-size:1.5rem;
    padding: 1rem;
    text-transform: capitalize;
    background-color: #444;
    color: goldenrod;
}

.districts-row{
    background-color: #393;
    font-size:1.2rem;
    font-size: .8rem;
    padding: .25rem;
    padding-bottom: 2rem;
    text-align:center;
}
.kingdom-row{
    background-color: #339;
    font-size:1.2rem;
}
.kingdom-subrow{
    background-color: #66C;
    font-size:1.1rem;

}
.class-row{
    background-color: #379;
    font-size:1.2rem;
}

.kingdom-row, .class-row{
    color:white;
}

.class-subrow{
    background-color: #6ac;
    font-size:1.1rem;    
}

.level-1{
    background-color: rgba(153, 51, 51, .5);
}
.level-2{
    background-color: rgba(102, 102, 204, .5);
}

.level-3{
    background-color: rgba(51, 119, 153, .5);
}

.table td:has(.icon-label){
    display: flex;
    justify-content: end;
}

.icon-label{
    /* background: red; */
    margin: auto;
}
</style>

<template>
    <div class="table-container">
        <template v-for="(superlative, region) in superlatives" :key="region">
            <table class="table" border="1">
                <thead>
                    <tr>
                        <th colspan="4" class="region-row" v-text="region"/>
                    </tr>
                    <tr>
                        <th>Category</th>
                        <th>District</th>
                        <th>State</th>
                        <th>Number</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="level-1">
                        <td>
                            <custom-icon icon="observations" />
                            <span class="icon-label">Most Observations</span>
                        </td>
                        <superlative-row :data="superlative.data.most_observations" />
                    </tr>
                    <tr class="level-1">
                        <td>
                            <custom-icon icon="users" />
                            <span class="icon-label">Most Users</span>
                        </td>
                        <superlative-row :data="superlative.data.most_users" />
                    </tr>
                    <tr class="level-1">
                        <td>
                            <custom-icon icon="taxa" />
                            <span class="icon-label">Most Taxa</span>
                        </td>
                        <superlative-row :data="superlative.data.taxa.max_taxa" />
                    </tr>
                    <tr>
                        <td colspan="4" class="kingdom-row">Kingdom</td>
                    </tr>
                    <template v-if="superlative.data.taxa.taxa_wise.kingdom">
                        <superlative-multiple-rows row_class="level-2" label="Animalia" icon="mammalia" :data="superlative.data.taxa.taxa_wise.kingdom.Animalia" />
                        <superlative-multiple-rows row_class="level-2" label="Plantae" icon="pinopsida" :data="superlative.data.taxa.taxa_wise.kingdom.Plantae" />
                        <superlative-multiple-rows row_class="level-2" label="Fungi" icon="lecanoromycetes" :data="superlative.data.taxa.taxa_wise.kingdom.Fungi" />
                    </template>
                    <tr>
                        <td colspan="4" class="class-row">Classes</td>
                    </tr>
                    <template v-for="(value, key) in superlative.data.taxa.taxa_wise.class" :key="key">
                        <superlative-multiple-rows row_class="level-3" :label="key" :icon="key"  :data="value" />
                    </template>
                    <tr>
                        <td colspan="3" class="districts-row">{{superlative.districts}}</td>
                        <td class="districts-row">{{ superlative.districts.length }}</td>
                    </tr>
                </tbody>
            </table>
        </template>
    </div>
</template>

<script lang="js">
import {defineComponent} from 'vue'
import {mapState} from 'vuex'
import CustomIcon from './CustomIcon.vue'
import SuperlativeRow from './SuperlativeRow.vue'
import SuperlativeMultipleRows from './SuperlativeMultipleRows.vue'

export default defineComponent({
  name: 'Superlatives',
  components: {
    CustomIcon,
    SuperlativeRow,
    SuperlativeMultipleRows,
  },
  computed: {
    ...mapState(["superlatives"]),
  }
})

</script>