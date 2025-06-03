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
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
