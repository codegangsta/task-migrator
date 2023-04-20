import * as chrono from 'chrono-node';
import { App, Editor, getIcon, MarkdownView, Plugin, PluginSettingTab, Setting, SuggestModal } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

interface MigrationTarget {
	filePath: string;
	date?: string;
	createFile?: boolean;
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

class OptionsModal extends SuggestModal<MigrationTarget> {

	constructor(app: App) {
		super(app)
		this.emptyStateText = "No files found"
		this.setPlaceholder("Migrate this task to...")
	}

	// parses a suggestion using chrono, if there is a hit, add it as a first suggestion
	// otherwise, return all files in the vault, filtered by the query
	getSuggestions(query: string): MigrationTarget[] | Promise<MigrationTarget[]> {
		return new Promise((resolve) => {
			let dateQuery = query
			if (query.startsWith("tod")) {
				dateQuery = "Today"
			}
			if (query.startsWith("tom")) {
				dateQuery = "Tomorrow"
			}
			if (query.startsWith("yes")) {
				dateQuery = "Yesterday"
			}
			if (query.startsWith("mon")) {
				dateQuery = "Monday"
			}
			if (query.startsWith("tue")) {
				dateQuery = "Tuesday"
			}
			if (query.startsWith("wed")) {
				dateQuery = "Wednesday"
			}
			if (query.startsWith("thu")) {
				dateQuery = "Thursday"
			}
			if (query.startsWith("fri")) {
				dateQuery = "Friday"
			}
			if (query.startsWith("sat")) {
				dateQuery = "Saturday"
			}
			if (query.startsWith("sun")) {
				dateQuery = "Sunday"
			}

			query = query.toLowerCase()
			const parsed = chrono.parseDate(dateQuery)
			const date = parsed ? parsed.toISOString().split('T')[0] : null

			const files: MigrationTarget[] = this.app.vault.getMarkdownFiles()
				.map((file) => file.path)
				.filter((path) => path.toLowerCase().includes(query))
				.map((path) => ({ filePath: path }))

			// check if a file with the date already exists in "Daily Logs" folder
			if (parsed) {
				const path = "Daily Logs/" + date + ".md"
				const dailyLogPath = this.app.vault.getAbstractFileByPath(path)
				if (!dailyLogPath) {
					files.unshift({ filePath: path, date: dateQuery, createFile: true })
				} else {
					files.unshift({ filePath: path, date: dateQuery })
				}
			}

			resolve(files)
		})
	}
	renderSuggestion(value: MigrationTarget, el: HTMLElement) {
		el.addClass('mod-complex')

		const content = el.createDiv('suggestion-content')
		content.appendText(value.filePath)
		el.appendChild(content)

		const aux = el.createDiv('suggestion-aux')
		el.appendChild(aux)

		if (value.date) {
			const flair = el.createDiv('suggestion-flair')
			flair.setText(value.date)
			aux.appendChild(flair)
		}
		if (value.createFile) {
			const icon = getIcon("calendar-plus")
			if (icon) {
				const flair = el.createDiv('suggestion-flair')
				flair.appendChild(icon)
				aux.appendChild(flair)
			}
		}


	}

	onChooseSuggestion(item: MigrationTarget, evt: MouseEvent | KeyboardEvent) {
		console.log(item.filePath)
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
