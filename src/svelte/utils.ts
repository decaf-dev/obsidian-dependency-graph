import type { App as ObsidianApp, TFile } from "obsidian";
import type { D3Link, D3Node } from "./types";

export function getD3Links(
	app: ObsidianApp,
	parentNote: TFile,
	forwardProperty: string
): {
	nodes: D3Node[];
	links: D3Link[];
} {
	const backlinks = app.metadataCache.resolvedLinks;
	console.log({
		resolvedLinks: backlinks,
	});

	const nodes: D3Node[] = [];
	const links: D3Link[] = [];

	// Add parent note as a node if it's not already included
	const parentNode: D3Node = { id: parentNote.basename };
	nodes.push(parentNode);

	for (const [sourcePath, sourceLinks] of Object.entries(backlinks)) {
		if (sourceLinks[parentNote.path]) {
			const sourceFile = app.vault.getFileByPath(sourcePath);
			if (!sourceFile) continue;

			const fileCache = app.metadataCache.getFileCache(sourceFile);
			const propertyValue = fileCache?.frontmatter?.[forwardProperty];
			if (!propertyValue) continue;

			let extractedValue = propertyValue;
			if (Array.isArray(propertyValue)) {
				extractedValue = propertyValue[0];
			}

			if (extractedValue.includes(parentNote.basename)) {
				const sourceNode: D3Node = { id: sourceFile.basename };
				nodes.push(sourceNode);

				links.push({
					source: sourceNode,
					target: parentNode,
				});
			}
		}
	}

	return { nodes, links };
}
