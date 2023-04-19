import * as chrono from 'chrono-node';
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

	constructor(app: App) {
		super(app)
		this.emptyStateText = "No files found"
	}

	// parses a suggestion using chrono, if there is a hit, add it as a first suggestion
	// otherwise, return all files in the vault, filtered by the query
	getSuggestions(query: string): string[] | Promise<string[]> {
		return new Promise((resolve) => {
			let dateQuery = query
			if (query.startsWith("tod")) {
				dateQuery = "today"
			}
			if (query.startsWith("tom")) {
				dateQuery = "tomorrow"
			}
			if (query.startsWith("yes")) {
				dateQuery = "yesterday"
			}
			if (query.startsWith("mon")) {
				dateQuery = "monday"
			}
			if (query.startsWith("tue")) {
				dateQuery = "tuesday"
			}
			if (query.startsWith("wed")) {
				dateQuery = "wednesday"
			}
			if (query.startsWith("thu")) {
				dateQuery = "thursday"
			}
			if (query.startsWith("fri")) {
				dateQuery = "friday"
			}
			if (query.startsWith("sat")) {
				dateQuery = "saturday"
			}
			if (query.startsWith("sun")) {
				dateQuery = "sunday"
			}

			query = query.toLowerCase()
			const parsed = chrono.parseDate(dateQuery)
			const date = parsed ? parsed.toISOString().split('T')[0] : null

			const files = this.app.vault.getMarkdownFiles()
				.map((file) => file.path)
				.filter((path) => path.toLowerCase().includes(query) || (date && path.toLowerCase().includes(date)))

			// check if a file with the date already exists in "Daily Logs" folder
			if (parsed) {
				const path = "Daily Logs/" + date + ".md"
				const dailyLogPath = this.app.vault.getAbstractFileByPath(path)
				if (!dailyLogPath) {
					files.push("Create new daily note: " + path)
				}
			}

			resolve(files)
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
