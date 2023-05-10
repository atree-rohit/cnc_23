import { createStore } from 'vuex';
import * as d3 from 'd3'
import jsonData from './assets/data/all_data_20230510.json'

const store = createStore({
  state: {
    location_groups: {},
    superlatives:{},
    test: jsonData
  },
  mutations: {
    INIT_LOCATION_GROUPS(state) {
        let district_data = d3.groups(Object.values(jsonData.observations), d => d.district_id)
        let op = {}
        district_data.map((d) => {
            let current_district = jsonData.districts[d[0]]
            if(state.location_groups[current_district.region] == undefined){
                state.location_groups[current_district.region] = {}
            }
            if(state.location_groups[current_district.region][current_district.state] == undefined){
                state.location_groups[current_district.region][current_district.state] = {}
            }
            if(state.location_groups[current_district.region][current_district.state][current_district.district] == undefined){
                state.location_groups[current_district.region][current_district.state][current_district.district] = []
            }
            state.location_groups[current_district.region][current_district.state][current_district.district] = d[1]
        })
    },
    COMPUTE_SUPERLATIVES(state) {
      const district_data = d3.groups(Object.values(jsonData.observations), d => d.district_id)
      let districts = Object.values(jsonData.districts).map((o) => {
        return {
          id: o.id,
          name: o.district,
        }
      })
      let states = Object.values(jsonData.districts).map((o) => {
        return {
          id: o.id,
          name: o.state,
          districts: Object.values(jsonData.districts).filter((d) => d.state == o.state).map((d) => d.district).sort()
        }
      })
      
      let most_observations = -1
      let most_observation_district = ""
      district_data.forEach((d) => {
        if(d[1].length > most_observations){
          most_observations = d[1].length
          most_observation_district = d[0]
        }
      })
      state.superlatives.most_observations = {
        district: districts.find((d) => d.id == most_observation_district).name,
        state: states.find((s) => s.districts.includes(districts.find((d) => d.id == most_observation_district).name)).name
      }
      states = states.filter((s) => s.name != state.superlatives.most_observations.state)
      
      let most_users = -1
      let most_users_district = ""
      district_data.forEach((d) => {
        let users = d3.groups(d[1], o => o.user_id).length
        if(users > most_users){
          most_users = users
          most_users_district = d[0]
        }
      })

      state.superlatives.most_users = {
        district: districts.find((d) => d.id == most_users_district).name,
        state: states.find((s) => s.districts.includes(districts.find((d) => d.id == most_users_district).name)).name
      }
      states = states.filter((s) => s.name != state.superlatives.most_users.state)
      
      
      console.log(state.superlatives)
    }
  },
  actions: {
    initLocationGroups({commit,state}) {
        commit("INIT_LOCATION_GROUPS")
        console.log("INIT_LOCATION_GROUPS")
    },
    computeSuperlatives({commit}) {
      // commit("COMPUTE_SUPERLATIVES")
    }
  },
  getters: {
    // your getters go here
  },
});

export default store;
