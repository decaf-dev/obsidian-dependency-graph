import * as d3 from "d3";

export interface D3Node extends d3.SimulationNodeDatum {
	id: string;
	x?: number;
	y?: number;
	fx?: number | null;
	fy?: number | null;
}

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
	source: D3Node;
	target: D3Node;
}
