import { parseYaml, Plugin } from "obsidian";
import { mount, unmount } from "svelte";
import DependencyGraphSettingTab from "./obsidian/DependencyGraphSettingTab";
import App from "./svelte/App.svelte";

interface DependencyGraphPluginSettings {
	enableDebug: boolean;
}

const DEFAULT_SETTINGS: DependencyGraphPluginSettings = {
	enableDebug: false,
};

export default class DependencyGraphPlugin extends Plugin {
	settings: DependencyGraphPluginSettings = DEFAULT_SETTINGS;
	svelteApp: ReturnType<typeof mount> | null = null;

	private parseSourceYaml(source: string): {
		parent: string;
		forwardProperty: string;
	} {
		const yaml = parseYaml(source) as unknown as {
			parent?: string | string[];
			forward?: string;
		} | null;

		if (!yaml) {
			throw new Error("invalid yaml");
		}

		let parent = yaml.parent;

		if (!parent) {
			throw new Error("parent is required");
		}

		const forwardProperty = yaml.forward;
		if (!forwardProperty) {
			throw new Error("forward is required");
		}

		if (Array.isArray(parent)) {
			parent = parent[0][0];
		}

		return { parent, forwardProperty };
	}

	async onload() {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor(
			"dependency-graph",
			(source, el, ctx) => {
				let parsed: { parent: string; forwardProperty: string };

				try {
					parsed = this.parseSourceYaml(source);
				} catch (error: unknown) {
					if (error instanceof Error) {
						el.innerHTML = `Dependency graph error: ${error.message}`;
						return;
					}

					el.innerHTML = "Unhandled dependency graph error";
					return;
				}

				const { parent, forwardProperty } = parsed;

				const parentFile = this.app.metadataCache.getFirstLinkpathDest(
					parent,
					ctx.sourcePath
				);
				if (!parentFile) {
					el.innerHTML = "Parent file not found";
					return;
				}

				if (!forwardProperty) {
					el.innerHTML = "Missing forward property";
					return;
				}

				if (this.settings.enableDebug) {
					console.log({ parentFile });
					console.log({ forwardProperty });
				}

				if (this.svelteApp) {
					unmount(this.svelteApp);
					this.svelteApp = null;
				}

				this.svelteApp = mount(App, {
					target: el,
					props: {
						app: this.app,
						parentFile,
						forwardProperty,
						enableDebug: this.settings.enableDebug,
					},
				});
			}
		);

		this.addSettingTab(new DependencyGraphSettingTab(this.app, this));
	}

	onunload() {
		if (this.svelteApp) {
			unmount(this.svelteApp);
			this.svelteApp = null;
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
