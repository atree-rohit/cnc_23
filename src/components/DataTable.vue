<style>
.overall-data{
    background:black;
    color:green;
    text-align: center;
    font-size:1.5rem;
    padding: 1rem;
}
.overall-data b{
    font-size: 2.25rem;
}
.instructions{
    font-size:2.0rem;
    text-align: center;
    padding: 2rem 0;
}
.stats-table-container{
    padding: 1rem;
    height: 87.5%;
    overflow: auto;
}
.stats-table table {
  border-collapse: collapse;
}

.stats-table th, td {
  padding: 10px;
  border: 1px solid transparent !important;
  text-align: center;
}


.stats-table th {
    background-color: #222;
    color: white;
    font-weight: bold;
}

.stats-table th.clickable div{
    cursor: pointer;
    display:flex;
    justify-content: center;
}
.stats-table th.clickable div:hover{
    background-color: #ddd;
}
.stats-table tr:nth-of-type(even) {
  background-color: #444;
}

.stats-table th{
    background: white;
    color: black;
    border-left: 2px solid red;
    border-right: 2px solid red;
    padding: 0.25rem .5rem; 
}
.stats-table .subtitle-row td{
    background: rgba(0, 128, 0, .5);
}
.stats-table tr:has(td):hover:not(.subtitle-row){
    background: rgb(255, 241, 116);
    color: black;
}

.stats-table tr, 
.stats-table th, 
.stats-table td{
    transition: all 150ms ease-in-out;
}
</style>

<template>
    <div class="overall-data" v-if="dataSet" v-html="overall_data">
    </div>
    <div v-else class="instructions">
        Select a region or state to view stats
    </div>
    <div class="stats-table-container">
        <table class="stats-table" v-if="dataSet">
            <thead>
                <tr>
                    <th>Name</th>
                    <th
                        v-for="col in fields"
                        :key="col"
                        class="clickable"
                        @click="sortColumn(col)"
                    >
                        <div>
                            {{ col }}
                            <template v-if="sort_col == col">
                                <span v-if="sort_dir == 'asc'">▲</span>                                
                                <span v-else>▼</span>
                            </template>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                <template v-for="(row, row_type) in sortedData" :key="row_type">
                    
                    <template v-if="type=='region'">
                        <template v-if="row_type != 'districts'">
                            <tr class="subtitle-row"><td colspan="6">{{ row_type }}</td></tr>
                            <tr v-if="!Array.isArray(row)">
                                <td>{{sortedData.region.region}}</td>
                                <td v-for="col in fields" :key="col">{{ format_number(row[col]) }}</td>
                            </tr>
                            <tr v-else v-for="r in row" :key="r.state">
                                <td>{{r.state}}</td>
                                <td v-for="col in fields" :key="col">{{ format_number(r[col]) }}</td>
                            </tr>
                        </template>
                    </template>
                    <template v-else>
                        <tr class="subtitle-row"><td colspan="6">{{ row_type }}</td></tr>
                        <tr v-if="!Array.isArray(row)">
                            <td>{{sortedData.state.state}}</td>
                            <td v-for="col in fields" :key="col">{{ format_number(row[col]) }}</td>
                        </tr>
                        <tr v-else v-for="r in row" :key="r.district">
                            <td>{{placeName(r)}}</td>
                            <td v-for="col in fields" :key="col">{{ format_number(r[col]) }}</td>
                        </tr>
                    </template>
                </template>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import districts from '../assets/data/districts_rewind.json'
export default defineComponent({
    name:"DataTable",
    props: ['table_data'],
    data(){
        return {
            fields: ['observations', 'users', 'unique_taxa', 'species_count', 'unidentified'],
            sort_col: 'observations',
            sort_dir: 'desc',
        }
    },
    computed:{
        type(){
            let keys = Object.keys(this.table_data)
            let op = ""
            switch(keys.length){
                case 3: op = "region"
                    break
                case 2: op = "state"
                    break
                case 1: op = "district"
                    break
            }
            return op
        },
        dataSet(){
            // return [0, undefined].indexOf(this.table_data?.districts?.length) == -1
            return true
        },
        preSortedData():{region: any, state: any, states: any, district: any, districts: any}{
            let op:{region: any, state: any, states: any, district: any, districts: any} = {
                region: null,
                state: null,
                states: null,
                district: null,
                districts: null

            }
            if(this.dataSet){
                Object.keys(this.table_data).forEach((k) => {
                    op[k as keyof typeof op] = this.sort_data(this.table_data[k])
                })
            }
            return op
        },
        sortedData():{region: any, state: any, states: any, district: any, districts: any}{
            let op = JSON.parse(JSON.stringify(this.preSortedData))
            Object.keys(op).forEach((k) => {
                if(op[k] == null || op[k].length == 0){
                    delete op[k]
                }
            })
            return op
        },
        overall_data(){
            let total = 0
            let current = 0
            let selected_geography = ""
            let geography = ""
            let op = ""
            if(this.type == "region"){
                total = [...new Set (
                            districts.features
                                .filter((f) => f.properties.region == this.table_data.region.region)
                                .map((f) => f.properties.state)
                        )].length
                
                current = this.table_data.states.length
                selected_geography = `${this.table_data.region.region} region`
                geography = "states"
            } else if (this.type == "state"){
                total = [...new Set (
                            districts.features
                                .filter((f) => f.properties.state == this.table_data.state.state)
                                .map((f) => f.properties.district)
                        )].length
                // total = districts.features.filter((f) => f.properties.state == this.table_data.state.state).map((f) => f.properties)
                current = this.table_data.districts.length
                selected_geography = `${this.table_data.state.state} state`
                geography = "districts"
            }
            op = `<b>${current}</b> of <b>${total}</b> ${geography} in the <u>${selected_geography}</u> have recorded observations during City Nature Challenge, 2023`
            if(Object.keys(this.table_data).length == 1){
                op = `Select a region or state to view stats`
            }
            return op
        }
    },
    methods:{
        format_number(num: number){
            if(Number.isInteger(num)){
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            return num
		},
        sortColumn(col: string){
            if(col == this.sort_col){
                this.sort_dir = this.sort_dir == "desc" ? "asc" : "desc"
            } else {
                this.sort_col = col
                this.sort_dir = "desc"
            }
        },
        sort_data(data: any){
            let op = []
            if(Array.isArray(data)){
                if(this.sort_dir == "desc"){
                    op = data.sort((a,b) => b[this.sort_col] - a[this.sort_col])                    
                } else {
                    op = data.sort((a,b) => a[this.sort_col] - b[this.sort_col])
                }
            } else {
                op = data
            }
            
            return op
        },
        placeName(region: any){
            if(region.district){
                return region.district
            } else if (region.state){
                return region.state
            } else if (region.region){
                return region.region
            }
        }
    }
})
</script>