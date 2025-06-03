<script lang="ts">
	import * as d3 from "d3";
	import type { App as ObsidianApp, TFile } from "obsidian";
	import { onMount } from "svelte";
	import type { D3Link, D3Node } from "./types";
	import { getD3Links } from "./utils";

	interface AppProps {
		app: ObsidianApp;
		parentFile: TFile;
		forwardProperty: string;
		enableDebug: boolean;
	}

	const { app, enableDebug, parentFile, forwardProperty }: AppProps =
		$props();

	let svgRef: SVGSVGElement | undefined = undefined;
	let simulation: d3.Simulation<D3Node, D3Link> | null = null;

	onMount(() => {
		if (!svgRef) return;

		const parent = svgRef.parentElement;
		if (!parent) return;

		svgRef.style.width = `${parent.clientWidth}px`;
		svgRef.style.height = `${parent.clientHeight}px`;

		const svg = d3.select<SVGSVGElement, unknown>(svgRef);

		const width = parseInt(svg.attr("width"));
		const height = parseInt(svg.attr("height"));

		// Get all backlinks to the parent note
		const { nodes, links } = getD3Links(app, parentFile, forwardProperty);

		if (enableDebug) {
			console.log({ nodes });
			console.log({ links });
		}

		// Define arrowhead marker
		svg.append("defs")
			.selectAll("marker")
			.data(["arrow"])
			.enter()
			.append("marker")
			.attr("id", (d) => d)
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 15)
			.attr("refY", 0)
			.attr("markerWidth", 6)
			.attr("markerHeight", 6)
			.attr("orient", "auto")
			.append("path")
			.attr("d", "M0,-5L10,0L0,5")
			.attr("class", "arrowhead");

		// Create simulation
		simulation = d3
			.forceSimulation<D3Node>(nodes)
			.force(
				"link",
				d3
					.forceLink<D3Node, D3Link>(links)
					.id((d) => d.id)
					.distance(50),
			)
			.force("charge", d3.forceManyBody().strength(-150))
			.force("center", d3.forceCenter(width / 2, height / 2));

		// Draw links with arrows
		const link = svg
			.append("g")
			.attr("class", "dependency-link")
			.selectAll<SVGLineElement, D3Link>("line")
			.data(links)
			.enter()
			.append("line")
			.attr("marker-end", "url(#arrow)");

		// Draw nodes
		const node = svg
			.append("g")
			.attr("class", "dependency-node")
			.selectAll<SVGCircleElement, D3Node>("circle")
			.data(nodes)
			.enter()
			.append("circle")
			.attr("r", 8)
			.call(
				d3
					.drag<SVGCircleElement, D3Node>()
					.on("start", dragstarted)
					.on("drag", dragged)
					.on("end", dragended),
			);

		// Add labels
		const label = svg
			.append("g")
			.selectAll<SVGTextElement, D3Node>("text")
			.data(nodes)
			.enter()
			.append("text")
			.text((d) => d.id)
			.attr("dx", 12)
			.attr("dy", ".35em");

		// Update positions on tick
		simulation.on("tick", () => {
			link.attr("x1", (d) => d.source.x ?? 0)
				.attr("y1", (d) => d.source.y ?? 0)
				.attr("x2", (d) => d.target.x ?? 0)
				.attr("y2", (d) => d.target.y ?? 0);

			node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);

			label.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
		});
	});

	// Drag functions
	function dragstarted(
		event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>,
		d: D3Node,
	) {
		if (!simulation) return;
		if (!event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(
		event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>,
		d: D3Node,
	) {
		d.fx = event.x;
		d.fy = event.y;
	}

	function dragended(
		event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>,
		d: D3Node,
	) {
		if (!simulation) return;
		if (!event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}
</script>

<svg bind:this={svgRef} width="300" height="200"></svg>

<style>
	:global(.dependency-node circle) {
		fill: var(--graph-node);
		stroke: var(--graph-node-stroke);
		stroke-width: var(--graph-node-stroke-width);
		cursor: pointer;
	}

	:global(.dependency-node circle:hover) {
		fill: var(--graph-node-hover);
	}

	:global(.dependency-link) {
		stroke: var(--graph-line);
		stroke-width: 2px;
	}

	:global(.arrowhead) {
		fill: var(--color-base-50);
	}

	:global(text) {
		font-family: Arial, sans-serif;
		font-size: 12px;
		color: var(--graph-text);
	}
</style>
