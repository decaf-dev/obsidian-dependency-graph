import { App, PluginSettingTab, Setting } from "obsidian";
import type DependencyGraphPlugin from "src/main";

export default class DependencyGraphSettingTab extends PluginSettingTab {
	plugin: DependencyGraphPlugin;

	constructor(app: App, plugin: DependencyGraphPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Debug")
			.setDesc("Enable debug mode")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.debug)
					.onChange(async (value) => {
						this.plugin.settings.debug = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
