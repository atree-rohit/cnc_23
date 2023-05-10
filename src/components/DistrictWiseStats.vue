<style>
:root{
    --primary: #933;
    --secondary: #454;
    --tertiary: #445;
}
.table{
    width: 100%;
    border-collapse: collapse;
}

tr, th,td{
    padding: 0.5rem;
    text-align: center;
    border: 1px solid var(--primary);
    transition: all 100ms;
}
th{
    background: var(--primary);
    position: relative;
    cursor: pointer;
}

.header-content .icon{
    position: absolute;
    right:12.5%;
}

th:hover{
    background: var(--secondary);
}
tbody tr:hover td{
    background: var(--secondary);
    cursor:pointer;
}


ul {
  position: absolute;
  top: 100%;
  width: 100%;
  left: 0;
  padding: 0;
  margin: 0;
  list-style: none;
  background-color: rgba(0,0,0,0.95);
  border: 1px solid #ccc;
}

li {
  padding: 5px;
}

.selected{
    background-color: darkgoldenrod;
}
</style>

<template>
    <!-- <pre>
        {{ selected }}
    </pre>
    <pre>
        {{ showDropdown }}
    </pre> -->
    <table class="table">
        <thead>
            <tr>
                <th @click="showDropdown = (showDropdown == 'region') ? null : 'region'">
                    <div class="header-content">
                        <span>Region</span>
                        <span class="icon">▼</span>
                        <ul v-if="showDropdown == 'region'">
                            <li
                                v-for="region in dropdown_options.region"
                                :key="region"
                                @click="selected.region = (selected.region == region) ? null : region"
                                v-text="region"
                                :class="{selected: selected.region == region}"
                            />
                        </ul>
                    </div>
                </th>
                <th @click="showDropdown = (showDropdown == 'state') ? null : 'state'">
                    <div class="header-content">
                        <span>State</span>
                        <span class="icon">▼</span>
                        <ul v-if="showDropdown == 'state'">
                            <li
                                v-for="state in dropdown_options.state"
                                :key="state"
                                @click="selected.state = (selected.state == state) ? null : state"
                                v-text="state"
                                :class="{selected: selected.state == state}"
                            />
                        </ul>
                    </div>
                    
                </th>
                <th @click="showDropdown = (showDropdown == 'district') ? null : 'district'">
                    <div class="header-content">
                        <span>District</span>
                        <span class="icon">▼</span>
                        <ul v-if="showDropdown == 'district'">
                            <li
                                v-for="district in dropdown_options.district"
                                :key="district"
                                @click="selected.district = (selected.district == district) ? null : district"
                                v-text="district"
                                :class="{selected: selected.district == district}"
                            />
                        </ul>
                    </div>
                </th>
                <th @click="setSort('observations')">Observations <span v-text="sortIcon('observations')"/></th>
                <th @click="setSort('users')">Users <span v-text="sortIcon('users')"/></th>
                <th @click="setSort('taxa')">Unique Taxa <span v-text="sortIcon('taxa')"/></th>
            </tr>
        </thead>
        <tbody>
            <tr
                v-for="row in filtered_data"
                :key="row.district"
            >
                <td v-text="row.region"/>
                <td v-text="row.state"/>
                <td v-text="row.district"/>
                <td v-text="row.observations"/>
                <td v-text="row.users"/>
                <td v-text="row.taxa"/>

            </tr>
        </tbody>
    </table>
</template>

<script lang="js">
import { defineComponent } from 'vue'
import {mapState} from 'vuex'
import * as d3 from 'd3'

export default defineComponent({
    name: "DistrictWiseStats",
    data(){
        return {
            showDropdown: null,
            selected: {
                region: null,
                state: null,
                district: null,
            },
            sort_mode: {
                observations: "unsorted",
                users: "unsorted",
                taxa: "unsorted",
            },
            sort_icons:{
                unsorted: "⇅",
                ascending: "↓",
                descending: "↑",
            },
        }
    },
    mounted(){
        console.clear()
        // console.log(this.superlatives)
        // console.log(this.joined_data[0])
        let data = d3.rollups(this.joined_data, v=> v.length, d => d.region, d => d.class, d => d.state)
        let states = d3.groups(this.joined_data, d => d.region, d => d.state)
        // console.log({states, data})
        let max = {
            north: {},
            east: {},
            south: {},
            west: {},
        }
        data.forEach((region) => {
            const region_name = region[0]
            const region_data = region[1].sort((a,b) => b[1].length - a[1].length)
            const region_states = states.filter((s) => s[0] == region_name)[0][1].map((rs) => rs[0])
            let set_states = []
            region_data.forEach((rd) => {
                if(rd[0]){
                    const sorted_data = rd[1].sort((a,b) => b[1].length - a[1].length)
                    console.log(rd[0], rd[1], sorted_data)
                    if(!set_states.includes(rd[1][0][0])){
                        set_states.push(rd[1][0][0])
                        max[region_name][rd[0]] = rd[1][0][0]
                    }
                }
            })
            console.log({region_name, region_states, set_states})
        })
        console.log(max)
    },
    computed: {
        ...mapState([
            "location_groups",
            "test"
        ]),
        joined_data(){
            let op = Object.values(this.test.observations).map((o) => {
                return {
                    ...o,
                    ...this.test.users[o.user_id],
                    ...this.test.taxa[o.taxon_id],
                    ...this.test.districts[o.district_id]
                }
            })
            
            return op
        },
        superlatives(){
            let op = {
                observations: {
                    overall: this.getMostObservationState(this.joined_data),
                    north: this.getMostObservationState(this.joined_data.filter((d) => d.region == "north")),
                    east: this.getMostObservationState(this.joined_data.filter((d) => d.region == "east")),
                    south: this.getMostObservationState(this.joined_data.filter((d) => d.region == "south")),
                    west: this.getMostObservationState(this.joined_data.filter((d) => d.region == "west")),
                },
                users: {
                    overall: this.getMostUsersState(this.joined_data),
                    north: this.getMostUsersState(this.joined_data.filter((d) => d.region == "north")),
                    east: this.getMostUsersState(this.joined_data.filter((d) => d.region == "east")),
                    south: this.getMostUsersState(this.joined_data.filter((d) => d.region == "south")),
                    west: this.getMostUsersState(this.joined_data.filter((d) => d.region == "west")),
                },
                taxa: {
                    all:{
                        overall: this.getMostTaxaState(this.joined_data),
                        north: this.getMostTaxaState(this.joined_data.filter((d) => d.region == "north")),
                        east: this.getMostTaxaState(this.joined_data.filter((d) => d.region == "east")),
                        south: this.getMostTaxaState(this.joined_data.filter((d) => d.region == "south")),
                        west: this.getMostTaxaState(this.joined_data.filter((d) => d.region == "west")),
                    },
                    plants: {
                        overall: this.getMostObservationState(this.joined_data.filter((d) => d.kingdom == "Plantae")),
                        north: this.getMostObservationState(this.joined_data.filter((d) => d.kingdom == "Plantae" && d.region == "north")),
                        east: this.getMostObservationState(this.joined_data.filter((d) => d.kingdom == "Plantae" && d.region == "east")),
                        south: this.getMostObservationState(this.joined_data.filter((d) => d.kingdom == "Plantae" && d.region == "south")),
                        west: this.getMostObservationState(this.joined_data.filter((d) => d.kingdom == "Plantae" && d.region == "west")),
                    },
                    gastropods: {
                        overall: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Gastropoda")),
                        north: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Gastropoda" && d.region == "north")),
                        east: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Gastropoda" && d.region == "east")),
                        south: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Gastropoda" && d.region == "south")),
                        west: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Gastropoda" && d.region == "west")),
                    },
                    arachnids: {
                        overall: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Arachnida")),
                        north: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Arachnida" && d.region == "north")),
                        east: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Arachnida" && d.region == "east")),
                        south: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Arachnida" && d.region == "south")),
                        west: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Arachnida" && d.region == "west")),
                    },
                    insects:{
                        overall: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Insecta")),
                        north: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Insecta" && d.region == "north")),
                        east: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Insecta" && d.region == "east")),
                        south: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Insecta" && d.region == "south")),
                        west: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Insecta" && d.region == "west")),
                    },
                    amphibians:{
                        overall: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Amphibia")),
                        north: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Amphibia" && d.region == "north")),
                        east: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Amphibia" && d.region == "east")),
                        south: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Amphibia" && d.region == "south")),
                        west: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Amphibia" && d.region == "west")),
                    },
                    reptiles: {
                        overall: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Reptilia")),
                        north: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Reptilia" && d.region == "north")),
                        east: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Reptilia" && d.region == "east")),
                        south: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Reptilia" && d.region == "south")),
                        west: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Reptilia" && d.region == "west")),
                    },
                    mammals:{
                        overall: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Mammalia")),
                        north: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Mammalia" && d.region == "north")),
                        east: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Mammalia" && d.region == "east")),
                        south: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Mammalia" && d.region == "south")),
                        west: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Mammalia" && d.region == "west")),
    
                    },
                    birds: {
                        overall: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Aves")),
                        north: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Aves" && d.region == "north")),
                        east: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Aves" && d.region == "east")),
                        south: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Aves" && d.region == "south")),
                        west: this.getMostObservationState(this.joined_data.filter((d) => d.class == "Aves" && d.region == "west")),                        
                    },

                },
            }
            
            return op
        },
        dropdown_options(){
            let op = {
                district: this.district_wise_data.map((d) => d.district),
                state: [...new Set(this.district_wise_data.map((d) => d.state))].sort(),
                region: [...new Set(this.district_wise_data.map((d) => d.region))].sort(),
            }
            if(this.selected.region != null){
                op.state = [...new Set(this.district_wise_data.filter((d) => d.region == this.selected.region).map((d) => d.state))].sort()
                op.district = [...new Set(this.district_wise_data.filter((d) => d.region == this.selected.region).map((d) => d.district))].sort()
            }
            if(this.selected.state != null){
                op.district = [...new Set(this.district_wise_data.filter((d) => d.state == this.selected.state).map((d) => d.district))].sort()
            }
            return op
        },
        filtered_data(){
            let op = this.district_wise_data
            if(this.selected.region != null){
                op = op.filter((d) => d.region == this.selected.region)
            }
            if(this.selected.state != null){
                op = op.filter((d) => d.state == this.selected.state)
            }
            if(this.selected.district != null){
                op = op.filter((d) => d.district == this.selected.district)
            }
            if(this.sort_mode.taxa != "unsorted"){
                if(this.sort_mode.taxa == "ascending"){
                    op = op.sort((a,b) => a.taxa - b.taxa)
                } else {
                    op = op.sort((a,b) => b.taxa - a.taxa)                    
                }
            }
            if(this.sort_mode.users != "unsorted"){
                if(this.sort_mode.users == "ascending"){
                    op = op.sort((a,b) => a.users - b.users)
                } else {
                    op = op.sort((a,b) => b.users - a.users)                    
                }
            }
            if(this.sort_mode.observations != "unsorted"){
                if(this.sort_mode.observations == "ascending"){
                    op = op.sort((a,b) => a.observations - b.observations)
                } else {
                    op = op.sort((a,b) => b.observations - a.observations)                    
                }
            }
            return op
        },
        district_wise_data(){
            let op = []
            for(let region in this.location_groups){
                let region_data = this.location_groups[region]
                for(let state in region_data){
                    let state_data = region_data[state]
                    for(let district in state_data){
                        let district_data = state_data[district]
                        op.push({
                            region,
                            state,
                            district,
                            observations: district_data.length,
                            users: this.getDistrictUsers(district_data).length,
                            taxa: this.getDistrictTaxa(district_data).length,
                        })
                    }
                }
            }
            return op
        }
    },
    methods: {
        getDistrictUsers(district_data){
            return [...new Set(district_data.map((d) => d.user_id))]
        },
        getDistrictTaxa(district_data){
            return [...new Set(district_data.map((d) => d.taxon_id))]
        },
        sortIcon(type){
            return this.sort_icons[this.sort_mode[type]]
        },
        setSort(type){
            if(this.sort_mode[type] == "unsorted"){
                this.sort_mode[type] = "descending"
            } else if(this.sort_mode[type] == "descending"){
                this.sort_mode[type] = "ascending"
            } else if(this.sort_mode[type] == "ascending"){
                this.sort_mode[type] = "descending"
            }
            ["observations", "users", "taxa"].forEach((t) => {
                if(t != type){
                    this.sort_mode[t] = "unsorted"
                }
            })

        },
        getMostObservationState(data){
            let group = d3.groups(data, (d) => d.state)
            const largestArray = group.reduce((acc, cur) => {
                if (cur[1].length > acc[1].length) {
                    return cur;
                } else {
                    return acc;
                }
            });

            return largestArray[0]
        },
        getMostUsersState(data){
            let group = d3.groups(data, (d) => d.state)
            let no_of_users = -1
            let state = ""
            group.forEach((g) => {
                let users = [...new Set(g[1].map((d) => d.user_id))]
                if(users.length > no_of_users){
                    no_of_users = users.length
                    state = g[0]
                }
            })

            return state
            
        },
        getMostTaxaState(data){
            let group = d3.groups(data, (d) => d.state)
            let no_of_taxa = -1
            let state = ""
            group.forEach((g) => {
                let taxa = [...new Set(g[1].map((d) => d.taxon_id))]
                if(taxa.length > no_of_taxa){
                    no_of_taxa = taxa.length
                    state = g[0]
                }
            })

            return state
        },
    }
})
</script>