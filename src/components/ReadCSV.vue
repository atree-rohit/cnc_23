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
            v-for="(region_data, region_name) in location_group"
            :key="region_name"
        >
            <div class="region-title" @click="selected.region = selected.region == region_name ? null: region_name">
                <div class="name">{{region_name}}</div>
                <div class="children">{{ getObservations("region", region_data) }}</div>
                <div class="users">{{ getUsers("region", region_data).length }}</div>
                <div class="taxa">{{ getTaxa("region", region_data).length }}</div>
            </div>
            <div class="region-data" v-if="selected.region == region_name">
                <div
                    class="state-wrapper"
                    v-for="(state_data, state_name) in region_data"
                    :key="state_name"
                >
                    <div class="state-title" @click="selected.state = selected.state == state_name ? null: state_name">
                        <div class="name">{{ state_name }}</div>
                        <div class="children">{{ getObservations("state", state_data) }}</div>
                        <div class="users">{{ getUsers("state", state_data).length }}</div>
                        <div class="taxa">{{ getTaxa("state", state_data).length }}</div>
                    </div>
                    <div class="state-data" v-if="selected.state == state_name">
                        <div
                            class="district-wrapper"
                            v-for="(district_data, district_name) in state_data" 
                            :key="district_name"
                        >
                            <div class="district-title">
                                <div class="name">{{district_name}}</div>
                                <div class="observations">{{ district_data.length }}</div>
                                <div class="users">{{ getUsers("district", district_data).length }}</div>
                                <div class="taxa">{{ getTaxa("district", district_data).length }}</div>
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
import jsonData from '../assets/data/all_data_20230510.json'


export default defineComponent({
    name: "ReadCSV",
        data(){
        return {
            data: jsonData,
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
            let district_data = d3.groups(Object.values(this.data.observations), d => d.district_id)
            let op = {}
            district_data.map((d) => {
                let current_district = this.data.districts[d[0]]
                if(current_district == undefined){
                    console.log(d)
                }
                if(op[current_district.region] == undefined){
                    op[current_district.region] = {}
                }
                if(op[current_district.region][current_district.state] == undefined){
                    op[current_district.region][current_district.state] = {}
                }
                if(op[current_district.region][current_district.state][current_district.district] == undefined){
                    op[current_district.region][current_district.state][current_district.district] = []
                }
                op[current_district.region][current_district.state][current_district.district] = d[1]
            })

            // console.log(op)
            return op
        }
    },
    methods:{
        getObservations(type, data){
            let no_of_observations = -1
            if(type == "region"){
                no_of_observations = Object.values(data).reduce((acc, item) => {
                    const childArrays = Object.values(item)
                    const childArrayLengths = childArrays.map(arr => arr.length)
                    const totalLength = childArrayLengths.reduce((sum, length) => sum + length, 0)
                    return acc + totalLength
                }, 0)
            } else if(type == "state"){
                no_of_observations = Object.values(data).reduce((acc, item) => {
                    const childArrays = Object.values(item)
                    const totalLength = childArrays.length
                    return acc + totalLength
                }, 0)
            } else if(type == "district"){
                no_of_observations = data.length
            }
            return no_of_observations
            // return [...new Set(region_data.map((d) => d[1]).flat().map((d) => d[1]).flat())]
        },
        getUsers(type, data){
            let all_users = []
            if(type == "region"){
                Object.values(data).forEach((state) => {
                    Object.values(state).forEach((district) => {
                        all_users.push(...this.getDistrictUsers(district))
                    })
                })
            } else if(type == "state"){
                Object.values(data).forEach((district) => {
                    all_users.push(...this.getDistrictUsers(district))
                })
            } else if(type == "district"){
                all_users.push(...this.getDistrictUsers(data))
            }
            return [...new Set(all_users)]
        },
        getTaxa(type, data){
            let all_taxa_ids = []
            if(type == "region"){
                Object.values(data).forEach((state) => {
                    Object.values(state).forEach((district) => {
                        all_taxa_ids.push(...this.getDistrictTaxa(district))
                    })
                })
            } else if(type == "state"){
                Object.values(data).forEach((district) => {
                    all_taxa_ids.push(...this.getDistrictTaxa(district))
                })
            } else if(type == "district"){
                all_taxa_ids = this.getDistrictTaxa(data)
            }
            return [...new Set(all_taxa_ids)]
        },


        getDistrictUsers(district_data){
            return [...new Set(district_data.map((d) => d.user_id))]
        },
        getDistrictTaxa(district_data){
            return [...new Set(district_data.map((d) => d.taxon_id))]
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