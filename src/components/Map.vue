<style>
	.switcher-sm .btn{
		font-size: 0.9rem !important;
	}
	
	.map-boundary path{
		/* stroke: transparent; */
		stroke-linejoin: round;
		stroke-width: .25;
		stroke:rgba(0, 0, 0, 0.5);
	}
	.map-boundary path:hover{
		cursor: pointer;
		fill: beige;
	}
	.map-boundary .current-state{
		stroke: rgba(0,50,255,.75);
		stroke-width:.25px;
		filter: brightness(1.25)
	}
	.map-boundary .selected-polygon{
		/*fill: #afa;*/
		fill: #ffff55;
		stroke: rgba(255,50,0,.75);
		stroke-width:.5px;
	}
	.poly_text{
		fill: #545;
		font-size: 0.85rem;
		transition: fill .125s;
		text-shadow: 
		0px 0px 1px white,
		0px 0px 2px white,
		0px 0px 3px white,
		0px 0px 4px white,
		0px 0px 5px white;
	}
	.poly_text:hover{
		fill: #00c;
		text-shadow: 0px 0px 5px #fff;
		cursor: pointer;
		font-weight: 1000;
	}
    .map-points circle{
		stroke-width: .5px;
		stroke: rgba(0,0,0,.25);
		fill: transparent;
	}
	.map-points circle:hover{
		cursor:pointer;
		stroke: rgba(0,255,0,.5);
	}
	svg{
		background: hsl(200, 50%, 75%);
	}
	.small-text{
		font-size: .85rem;
	}
	.legendCells .cell text{
		display: flex;
  		align-items: center;
	}
    table{
		border-collapse: collapse;
	}
	th,td{
        border: 1px solid white;
    }
    td {
        padding: 0.5rem 1rem;
    }
	@media screen and (max-width: 800px) {
		.poly_text{
			font-size: 3.5vw;
		}
	}
</style>

<template>
    <div ref="mapDiv">
		<div class="switcher switcher-sm">
			<button
				class="btn"
				v-for="pm in polygon_modes"
				:key="pm"
				:class="{'selected': pm === polygon_mode}"
				@click="polygon_mode = pm"
				v-text="pm"
			/>
		</div>
		<div class="switcher switcher-sm">
			<button
				class="btn"
				v-for="dm in data_modes"
				:key="dm"
				:class="{'selected': dm === data_mode}"
				@click="data_mode = dm"
				v-text="dm"
			/>
		</div>
		<div id="map-container"></div>
	</div>
</template>

<script lang="js">
import { defineComponent } from 'vue'
import {mapState} from 'vuex'
import regions from '../assets/data/regions.json'
import states from '../assets/data/states.json'
import districts from '../assets/data/districts_rewind.json'
import * as d3 from 'd3'
import * as d3Legend from "d3-svg-legend"

export default defineComponent({
    name: "Map",
    data(){
        return {
			polygon_modes: ["districts", "states", "regions"],
			polygon_mode: "districts",
			data_modes: ["observations", "users", "unique_taxa", "species_count", "unidentified"],
			data_mode: "observations",
            json: {regions, states, districts},
            polygons: null,
			path: null,
			svg: {},
			projection: {},
			colors: {},
			legend: {},
			state_data: {},
			selected_area:"All",
			max: 0,
			state_max: 0,
			height: window.innerHeight * 0.75,
			width: window.innerWidth * 0.95,
			tooltip:null,
        }
    },
    mounted(){
        this.init_tooltip()
		this.init()
		// if(this.regional_data.length > 0){
		// }
    },
	watch:{
		regional_data(){
			this.init()
		},
		polygon_mode(){
			this.renderMap()
		},
		data_mode(){
			this.renderMap()
		}

	},
    computed:{
        ...mapState(["regional_data"]),
		polygon_key(){
			return this.polygon_mode.slice(0,-1)
		},
		mapData(){
			return this.regional_data[this.polygon_mode].map((d) => {
				return {
					name: d[this.polygon_key],
					value: d[this.data_mode]
				}
			})	
		},
		zoom() {
			return d3.zoom()
				.scaleExtent([.5, 250])
				.translateExtent([[-0.5 * this.width,-0.75 * this.height],[2.5 * this.width, 2.5 * this.height]])
				.on('zoom', this.handleZoom)
		},
    },
    methods: {
		format_number(num){
			return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		},
        capitalizeWords(str){
			return str ? str.charAt(0).toUpperCase() + str.slice(1) : ""
		},
        color_polygon(polygon) {
			let polygon_data = this.mapData.find((d) => d.name == polygon[this.polygon_key])
			if(polygon_data){
				return this.colors(polygon_data.value)
			}
            return this.colors(0)
			// 'hsl(100,10%, 75%)'
        },
        handleZoom(e){
			this.zoomTransform = e.transform
			let text_size = (1/e.transform.k * .8)
            this.svg.selectAll('.poly_text')
                .attr('transform', e.transform)
				.style('font-size', `${text_size}rem`)
            this.svg.selectAll('path')
                .attr('transform', e.transform)
            this.svg.selectAll('circle')
                .attr('transform', e.transform)
				.attr("r", text_size)
        },
		init () {
			this.polygons = null
			this.path = null
			this.svg = {}
			this.height = window.innerHeight * 0.8
			this.width = this.$refs.mapDiv.clientWidth * 0.95
			if(window.innerWidth < 800){
				this.projection = d3.geoMercator().scale(600).center([110, 20])
			} else {
				this.projection = d3.geoMercator().scale(800).center([65, 23])
			}
			this.path = d3.geoPath().projection(this.projection)
			this.renderMap()
		},
		init_tooltip(){
            this.tooltip = d3.select('body')
							    .append('div')
							    .attr('class', 'd3-tooltip')
							    .style('position', 'absolute')
							    .style('top', '0')
							    .style('z-index', '10')
							    .style('visibility', 'hidden')
							    .style('padding', '10px')
							    .style('background', 'rgba(0,0,0,0.6)')
							    .style('border-radius', '4px')
							    .style('color', '#fff')
							    .text('a simple tooltip')
        },
		init_legend() {
			this.colors = {}
			this.legend = {}
			this.max = Math.max(...this.mapData.map((d) => d.value))
			
			this.colors = d3.scaleLinear()
				.domain([0, 1, this.max*.25, this.max])
				.range(["#f77", "#ca0", "#ada", "#3d3"])
				.clamp(true)
			this.legend = d3Legend.legendColor()
								.shapeHeight(20)
								.shapeWidth(60)
								.scale(this.colors)
								.labelFormat(d3.format(",.0f"))
								.orient('horizontal')
								.labelOffset(-10)
								.labelAlign("middle")
								.cells(6)
		},			
		renderMap () {
			this.init_legend()
			
			if (!d3.select("#map-container svg.svg-content").empty()) {
				d3.select("#map-container svg.svg-content").remove()
			}
			this.svg = d3.select("#map-container")
						.append("svg")
							.attr("preserveAspectRatio", "xMinYMin meet")
							.attr("width", this.width)
							.attr("height", this.height)
							.classed("svg-content", true)
			if(!this.zoomTransform){
				this.zoomTransform =  d3.zoomTransform(this.svg.node())
			}

			if(this.height > this.width){
				this.legend.shapeWidth(35)
				.cells(4)
			}
			let base = this.svg.append("g")
				.classed("map-boundary", true)
				.selectAll("path").append("g")
			let base_text = this.svg.append("g")
				.classed("map-labels", true)
				.selectAll("text").append("g")
			this.polygons = base.append("g")
				.classed("polygons", true)
			
			this.json[this.polygon_mode].features.forEach((polygon) => {
				this.drawPolygon(polygon)
				if(this.polygon_mode != "districts"){
					this.drawPolygonLabel(base_text, polygon)
				}
			})
			
			this.svg.append("g")
				.attr("transform", "translate("+this.width*.5+", 50)")
				.call(this.legend)
			this.svg.call(this.zoom)

			this.svg.call(this.zoom.transform, this.zoomTransform)
		},
		drawPolygon(polygon){
			this.polygons.append("g")
				.data([polygon])
				.enter().append("path")
				.attr("d", this.path)
				.attr("id", this.getPolygonId(polygon.properties))
				.attr("fill", (d) => this.color_polygon(polygon.properties))
				.on('mouseover', (d, i) => {
					this.tooltip.html(this.hover_text(polygon.properties))
						.style('visibility', 'visible')
				})
				.on('mousemove', (event, d) => {
					this.tooltip
						.style('top', event.pageY - 10 + 'px')
						.style('left', event.pageX + 10 + 'px')
				})
				.on('mouseout', () => this.tooltip.html(``).style('visibility', 'hidden'))
				.on("click", (d, polygon_details) => this.clicked(polygon_details))
		},
		drawPolygonLabel(base_text, polygon){
			const polygon_data = this.regional_data[this.polygon_mode].find((d) => d[this.polygon_key] == polygon.properties[this.polygon_key])
			let data = ""
			if(polygon_data){
				data = this.format_number(polygon_data[this.data_mode])
			}
			
			base_text.append("g")
				.data([polygon])
				.enter().append("text")
				.classed("poly_text", true)
				.attr("x", (h) => this.path.centroid(h)[0] )
				.attr("y", (h) => this.path.centroid(h)[1] )
				.classed("small-text", true)
				.attr("text-anchor", "middle")
				.text(data)
				.on('mouseover', () => {
					this.tooltip.html(this.hover_text(polygon.properties))
						.style('visibility', 'visible');
				})
				.on('mousemove', (event, d) => {
					this.tooltip
						.style('top', event.pageY - 10 + 'px')
						.style('left', event.pageX + 10 + 'px')
				})
				.on('mouseout', () => this.tooltip.html(``).style('visibility', 'hidden'))
				.on("click", (d, polygon_details) => this.clicked(polygon_details))
			
			
		},
		hover_text(properties){
			const polygon_data = this.regional_data[this.polygon_mode].find((d) => d[this.polygon_key] == properties[this.polygon_key])
			const {region, state, district} = properties || {}
			const {observations, users, unique_taxa, species_count, unidentified} = polygon_data || {}
			const tooltip_data = { region, state, district, observations, users, unique_taxa, species_count, unidentified}
			let op = Object.entries(tooltip_data)
				.map(([key, value]) => `<tr><td>${this.capitalizeWords(key)}</td><td>${value ? value: "-"}</td></tr>`)	
			return `<table>${op.join('\n')}</table>`
			
		},
		getPolygonId(polygon){
			let op = polygon.region
			let replace_chars = [" ", "&", "(", ")", "."]
			if(polygon.state != undefined){
				op = polygon.state
			}
			if(polygon.district != undefined){
				op = polygon.district
			}
			replace_chars.forEach((c) => {
				op = op.replaceAll(c, "_")
			})
			return op
		},
		set_state_class (state, district) {
			this.mapLayers[2].features.map((p) => {
				if(p.properties.state == state && p.properties.district != district){
					d3.select("#" + this.getPolygonId(p.properties)).classed("current-state", true)
				}
			})
		},
		clicked(polygon_details) {
			console.log(polygon_details)
			const {region, state, district} = polygon_details.properties || {}
			const polygon = polygon_details.geometry
			this.tooltip.html(``).style('visibility', 'hidden')
			let [[x0, y0], [x1, y1]] = [[0,0], [0,0]]
			
			d3.selectAll(".current-state").classed("current-state", false)
			d3.selectAll(".selected-polygon").classed("selected-polygon", false)
			if(this.selected_area == "All" || this.selected_area != name){
				this.selected_area = name;
				[[x0, y0], [x1, y1]] = this.path.bounds(polygon);
				d3.select("#" + this.getPolygonId(polygon_details.properties)).classed("selected-polygon", true)
				if(this.mapMode == 2){
					this.set_state_class(state, district)
				}
			} else {
				this.selected_area = "All";
				[[x0, y0], [x1, y1]] = this.path.bounds(regions);
			}
			// this.selectArea()
			
			this.svg.transition().duration(750).call(
				this.zoom.transform,
				d3.zoomIdentity
				.translate(this.width / 2, this.height / 2)
				.scale(Math.min(8, 0.9 / Math.max((x1 - x0) / this.width, (y1 - y0) / this.height)))
				.translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
			)
		},
		dispatchSelectArea(type, name){
			store.dispatch('setSelected', {
				filter: type,
				value: name
			})
		},
		selectArea () {
			if(this.selected_area == "All"){
				this.dispatchSelectArea("state", "All") 
			} else if(this.area_names.state.indexOf(this.selected_area) != -1){
				this.dispatchSelectArea("state", this.selected_area) 
			}
		},
    }
})
</script>