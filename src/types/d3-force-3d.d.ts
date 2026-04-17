declare module "d3-force-3d" {
	interface ForceCollideForce<NodeDatum = unknown> {
		iterations(value: number): ForceCollideForce<NodeDatum>;
		strength(value: number): ForceCollideForce<NodeDatum>;
	}

	export function forceCollide<NodeDatum = unknown>(radius?: number | ((node: NodeDatum) => number)): ForceCollideForce<NodeDatum>;
}
