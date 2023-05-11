import { createStore } from 'vuex';
import * as d3 from 'd3'
import jsonData from './assets/data/all_data_20230511.json'

const store = createStore({
  state: {
    location_groups: {},
    superlatives:{},
    test: jsonData,
    districts_list:{},
    joined_data: [],
    district_data: []
  },
  mutations: {
    INIT_LOCATION_GROUPS(state) {
        let district_data = d3.groups(Object.values(jsonData.observations), d => d.district_id)
        
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
        Object.values(jsonData.districts).forEach((d) => {
          state.districts_list[d.id] = d.district
        })
        state.joined_data = Object.values(jsonData.observations).map((o) => {
          let id_level = null
          let taxon_fields = ["kingdom", "phylum", "subphylum", "class", "subclass", "order", "suborder", "superfamily", "family", "subfamily", "tribe", "subtribe", "genus", "species"]
          let taxa = jsonData.taxa[o.taxon_id]
          taxon_fields.forEach((t) => {
            if(o.taxon_id && taxa[t] == taxa.scientific_name){
              id_level = t
            }
          })

          return {
              ...o,
              ...jsonData.users[o.user_id],
              ...jsonData.taxa[o.taxon_id],
              ...jsonData.districts[o.district_id],
              id_level: id_level,
          }
        })
        state.district_data = d3.groups(Object.values(jsonData.observations), d => d.district_id).map((d) => {
          return [
            state.districts_list[d[0]],
            d[1]  
          ]
        })
    },
    COMPUTE_SUPERLATIVES(state) {      
      state.superlatives = {
        overall: getMosts(state, getRegionData(state, "all")),
        north: getMosts(state, getRegionData(state, "north")),
        east: getMosts(state, getRegionData(state, "east")),
        south: getMosts(state, getRegionData(state, "south")),
        west: getMosts(state, getRegionData(state, "west")),
      }
      console.log(state.superlatives)
    }
  },
  actions: {
    initLocationGroups({commit,state}) {
        commit("INIT_LOCATION_GROUPS")
        console.log("INIT_LOCATION_GROUPS")
    },
    computeSuperlatives({commit}) {
      commit("COMPUTE_SUPERLATIVES")
    }
  },
  getters: {
    // your getters go here
  },
});


function getRegionData(state, region){
  let op = []
  let data = state.joined_data
  let states = Object.values(jsonData.districts).map((o) => {
    return {
      id: o.id,
      name: o.state,
      region: o.region,
      districts: Object.values(jsonData.districts).filter((d) => d.state == o.state).map((d) => {
        return {
          district_id: d.id,
          name: d.district,
          state: d.state,
        }
      }).sort()
    }
  })
  
  if(region == "all"){
    op = d3.groups(data, d => d.district_id)
  } else  {
    let districts = states.filter((s) => s.region == region).map((s) => s.districts).flat().map((d)=> d.district_id)
    op = d3.groups(data.filter((o) => districts.includes(o.district_id)), d => d.district_id)
  }
  return op
}

function getMosts(state, data){
  return prune({
    most_observations: getMostObservations(state, data),
    most_users: getMostUsers(state, data),
    taxa: {
      max_taxa: getMostTaxa(state, data),
      taxa_wise: getTaxaWise(state, data),
      id_level: getIDLevelWise(state, data)
    },
  })  
}

function getMostObservations(state, data){
  data.sort((a,b) => b[1].length - a[1].length)
  
  return {
    district: state.districts_list[data[0][0]],
    state: jsonData.districts[data[0][0]].state,
    observations: data[0][1].length
  }
}

function getMostUsers(state, data){
  let users = data.map((d) => {
    return {
      district_id: d[0],
      users: d3.groups(d[1], o => o.user_id).length
    }
  }).sort((a, b) => b.users - a.users)
  
  return {
    district: state.districts_list[users[0].district_id],
    state: jsonData.districts[users[0].district_id].state,
    users: users[0].users
  }
}

function getMostTaxa(state, data){
  let taxa = data.map((d) => {
    return {
      district_id: d[0],
      taxa: d3.groups(d[1], o => o.taxon_id).length
    }
  }).sort((a, b) => b.taxa - a.taxa)
  
  return {
    district: state.districts_list[taxa[0].district_id],
    state: jsonData.districts[taxa[0].district_id].state,
    taxa: taxa[0].taxa
  }
}

function getTaxaWise(state, data){
  let op = {}
  let filters = [
    ["kingdom", "Animalia"],
    ["kingdom", "Plantae"],
    ["kingdom", "Fungi"],
  ]
  d3.groups(data.map((d) => d[1]).flat(), d => d.class)
    .filter((d) => ["", undefined].includes(d[0]) == false)
    .map((c) => filters.push(["class", c[0]]))

  filters.forEach((f) => {
    let filtered_data = filterDataByTaxa(data, f[0], f[1])
    if(op[f[0]] == undefined){
      op[f[0]] = {}
    }
    op[f[0]][f[1]] = {
      most_observations: getMostObservations(state, filtered_data),
      most_users: getMostUsers(state, filtered_data),
      most_taxa: getMostTaxa(state, filtered_data),      
    }
  })

  // console.log(data)
  return op
}

function filterDataByTaxa(data, level, taxa){
  return data.map((d) => {
    return [
      d[0],
      d[1].filter((o) => o[level] == taxa)
    ]
  })
}

function getIDLevelWise(state, data){
  let taxon_fields = ["kingdom", "phylum", "subphylum", "class", "subclass", "order", "suborder", "superfamily", "family", "subfamily", "tribe", "subtribe", "genus", "species"]
  let op = {}

  op.unidentified = {
    most_observations: getMostObservations(state, filterDataByIDLevel(data, null)),
    most_users: getMostUsers(state, filterDataByIDLevel(data, null)),
    most_taxa: getMostTaxa(state, filterDataByIDLevel(data, null)),
  }
  
  taxon_fields.forEach((f) => {
    let filtered_data = filterDataByIDLevel(data, f)
    op[f] = {
      most_observations: getMostObservations(state, filtered_data),
      most_users: getMostUsers(state, filtered_data),
      most_taxa: getMostTaxa(state, filtered_data),
    }
  })
  return op

}

function filterDataByIDLevel(data, level){
  return data.map((d) => {
    return [
      d[0],
      d[1].filter((o) => o.id_level == level)
    ]
  })
}

function prune(data){
  
  //1st level, observations, users, taxa
  let op = {
    most_observations: data.most_observations,
    most_users: data.most_users,
    taxa: {
      max_taxa: data.taxa.max_taxa
    },
  }
  let districts_covered = [...new Set([data.most_observations.district, data.most_users.district, data.taxa.max_taxa.district])]

  
  //2nd level, taxa_wise->kingdom
  Object.keys(data.taxa.taxa_wise).forEach((t) => {
    Object.keys(data.taxa.taxa_wise[t]).forEach((d) => {
      Object.keys(data.taxa.taxa_wise[t][d]).forEach((k) => {
        if(!districts_covered.includes(data.taxa.taxa_wise[t][d][k].district)){
          if(op.taxa.taxa_wise == undefined){
            op.taxa.taxa_wise = {}
          }
          if(op.taxa.taxa_wise[t] == undefined){
            op.taxa.taxa_wise[t] = {}
          }
          if(op.taxa.taxa_wise[t][d] == undefined){
            op.taxa.taxa_wise[t][d] = {}
          }
          op.taxa.taxa_wise[t][d][k] = data.taxa.taxa_wise[t][d][k]
          
          districts_covered.push(data.taxa.taxa_wise[t][d][k].district)
          // console.log(1, JSON.stringify(...districts_covered))
          // console.log(2, JSON.stringify(...districts_covered))

        }
      })
    })
  })

  //3rd level, taxa_wise->id_level
  Object.keys(data.taxa.id_level).forEach((l) => {
    Object.keys(data.taxa.id_level[l]).forEach((d) => {
      if(!districts_covered.includes(data.taxa.id_level[l][d].district)){
        if(op.taxa.id_level == undefined){
          op.taxa.id_level = {}
        }
        if(op.taxa.id_level[l] == undefined){
          op.taxa.id_level[l] = {}
        }
        op.taxa.id_level[l][d] = data.taxa.id_level[l][d]
        districts_covered.push(data.taxa.id_level[l][d].district)
      }
    })
  })
  return {
    data: op,
    districts: [...districts_covered]
  }
}



export default store;
