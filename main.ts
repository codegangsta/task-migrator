import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting, SuggestModal } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'migrate-task',
			name: 'migrate a task to another file',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				new OptionsModal(this.app).open()
			}
		})

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class OptionsModal extends SuggestModal<string> {
	getSuggestions(query: string): string[] | Promise<string[]> {
		return new Promise((resolve) => {
			resolve(["one", "two", "three"])
		})
	}
	renderSuggestion(value: string, el: HTMLElement) {
		el.setText(value)
	}
	onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent) {
		console.log(item)
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
