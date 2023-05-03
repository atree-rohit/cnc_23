<style>
    .csv-wrapper{
        margin: 1rem;
        border: 2.5px solid #000;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .title-row,
    .region-title,
    .state-title,
    .district-title{
        padding: 0.25rem;
        display: flex;
        transition: all 1s;
    }
    
    .title-row > *,
    .region-title > *,
    .state-title > *,
    .district-title > *{
        flex: 1 1 0;
    }
    .title-row {
        font-size: 2.5rem;
        background: black;
    }
    .region-title{
        font-size: 2.5rem;
    }
    .state-title{
        font-size: 1.75rem;
        padding-left: 1rem;
    }
    .district-title{
        font-size: 1rem;
        padding-left: 2rem;
    }
    .region-title:hover{
        background-color: hsla(0, 100%, 50%, .25);
        cursor: pointer;
    }
    .state-title:hover{
        background-color: hsla(120, 100%, 25%, .25);
        cursor: pointer;
    }
    .district-title:hover{
        background-color: hsla(240, 100%, 50%, .25);
    }
</style>

<template>
    <div class="csv-wrapper">
        <div class="title-row">
            <div>Area</div>
            <div>Observations</div>
            <div>Users</div>
            <div>Unique Taxa</div>
        </div>
        <div
            class="region-wrapper"
            v-for="region in location_group"
            :key="region[0]"
        >
            <div class="region-title" @click="selected.region = selected.region == region[0] ? null: region[0]">
                <div class="name">{{region[0]}}</div>
                <div class="children">{{ getRegionObservations(region[1]).length }}</div>
                <div class="users">{{ getRegionUsers(region[1]).length }}</div>
                <div class="taxa">{{ getRegionTaxa(region[1]).length }}</div>
            </div>
            <div class="region-data" v-if="selected.region == region[0]">
                <div
                    class="state-wrapper"
                    v-for="state in region[1]"
                    :key="state[0]"
                >
                    <div class="state-title" @click="selected.state = selected.state == state[0] ? null: state[0]">
                        <div class="name">{{ state[0] }}</div>
                        <div class="children">{{ getStateObservations(state[1]).length }}</div>
                        <div class="users">{{ getStateUsers(state[1]).length }}</div>
                        <div class="taxa">{{ getStateTaxa(state[1]).length }}</div>
                    </div>
                    <div class="state-data" v-if="selected.state == state[0]">
                        <div
                            class="district-wrapper"
                            v-for="district in state[1]" 
                            :key="district[0]"
                        >
                            <div class="district-title">
                                <div class="name">{{district[0]}}</div>
                                <div class="observations">{{ district[1].length }}</div>
                                <div class="users">{{ getDistrictUsers(district[1]).length }}</div>
                                <div class="taxa">{{ getDistrictTaxa(district[1]).length }}</div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="js">
import { defineComponent } from 'vue'
import * as d3 from 'd3'
import jsonData from '../assets/data/data.json'
import dataNormalized from '../assets/data/data_normalized.json'
import dataQGIS from '../assets/data/data_with_districts.json'

export default defineComponent({
    name: "ReadCSV",
        data(){
        return {
            data: dataNormalized,
            observations: dataQGIS,
            selected: {
                region: null,
                state: null,
            }
        }
    },
    created(){
        console.clear()
    },
    computed:{
        location_group(){
            return d3.groups(this.observations, d=> d.region, d => d.state, d => d.district)
        }
    },
    methods:{
        getDistrictUsers(district_data){
            return [...new Set(district_data.map((d) => d.user_id))]
        },
        getStateUsers(state_data){
            return [...new Set(state_data.map((d) => d[1]).flat().map((d) => d.user_id))]
        },
        getRegionUsers(region_data){
            return [...new Set(region_data.map((d) => d[1]).flat().map((d) => d[1]).flat().map((d) => d.user_id))]
        },
        getStateObservations(state_data){
            return [...new Set(state_data.map((d) => d[1]).flat())]
        },
        getRegionObservations(region_data){
            return [...new Set(region_data.map((d) => d[1]).flat().map((d) => d[1]).flat())]
        },
        getDistrictTaxa(district_data){
            return [...new Set(district_data.map((d) => d.taxon_id))]
        },
        getStateTaxa(state_data){
            return [...new Set(state_data.map((d) => d[1]).flat().map((d) => d.taxon_id))]
        },
        getRegionTaxa(region_data){
            return [...new Set(region_data.map((d) => d[1]).flat().map((d) => d[1]).flat().map((d) => d.taxon_id))]
        },
        initData(){
            let observations = {}
            let users = {}
            let taxa = {}
            jsonData.forEach((data) => {
                let {common_name, iconic_taxon_name, scientific_name, taxon_id, user_id, user_login, user_name, ...remainder} = data
                observations[remainder.id] = remainder
                if(users[user_id] == undefined){
                    users[user_id] = {
                        id: user_id,
                        login: user_login,
                        name: user_name
                    }
                }
                if(taxon_id && taxa[taxon_id] == undefined){
                    taxa[taxon_id] = {
                        id: taxon_id,
                        group: iconic_taxon_name,
                        common: common_name,
                        scientific: scientific_name
                    }
                }
            })
            this.data = { observations, users, taxa }
            console.log(this.data)
        }
    }
})
</script>