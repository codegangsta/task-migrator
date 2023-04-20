import * as chrono from 'chrono-node';
import { App, Editor, getIcon, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, SuggestModal, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

interface MigrationTarget {
	filePath: string;
	date?: string;
	file?: TFile
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
				.filter((file) => file.path.toLowerCase().includes(query))
				.map((file) => ({ filePath: file.path, file: file }))

			// check if a file with the date already exists in "Daily Logs" folder
			if (parsed) {
				const path = "Daily Logs/" + date + ".md"
				const file = this.app.vault.getMarkdownFiles().find((file) => file.path === path)
				files.unshift({ filePath: path, date: dateQuery, file: file })
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
		if (!value.file) {
			const icon = getIcon("calendar-plus")
			if (icon) {
				const flair = el.createDiv('suggestion-flair')
				flair.appendChild(icon)
				aux.appendChild(flair)
			}
		}


	}

	async onChooseSuggestion(item: MigrationTarget, evt: MouseEvent | KeyboardEvent) {
		if (!item.file) {
			item.file = await this.app.vault.create(item.filePath, "")
		}


		const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor
		if (!editor) {
			console.log("No active editor")
			return
		}


		const lines: number[] = []
		// loop through all lines in the current selection, if there are no lines then use the current line
		const selections = editor.listSelections()
		if (selections.length === 0) {
			lines.push(editor.getCursor().line)
		} else {
			selections.forEach((selection) => {
				if (selection.head.line < selection.anchor.line) {
					for (let i = selection.head.line; i <= selection.anchor.line; i++) {
						lines.push(i)
					}
				} else {
					for (let i = selection.anchor.line; i <= selection.head.line; i++) {
						lines.push(i)
					}
				}
			})
		}

		const taskContent: string[] = []

		lines.forEach(async (lineNumber) => {
			const line = editor.getLine(lineNumber)
			const taskRegex = /(- \[(.)\] )(.*)/
			const taskMatch = line.match(taskRegex)
			if (!taskMatch) {
				console.log("No task found")
				return
			}

			// create a markdown link
			const link = this.app.fileManager.generateMarkdownLink(item.file, item.filePath)
			const newLine = line.replace(`- [${taskMatch[2]}] `, `- [>] `) + " " + link
			editor.setLine(lineNumber, newLine)
			taskContent.push(line)

		})

		// read file contents
		const content = await this.app.vault.read(item.file)
		// prepend task to new file, but put it after any frontmatter
		const frontmatter = "---"
		const frontmatterIndex = content.indexOf(frontmatter)
		if (frontmatterIndex !== -1) {
			const frontmatterEnd = content.indexOf("---", frontmatterIndex + frontmatter.length)
			if (frontmatterEnd !== -1) {
				const newContent = content.substring(0, frontmatterEnd + frontmatter.length) + taskContent.join("\n") + "\n" + content.substring(frontmatterEnd + frontmatter.length)
				await this.app.vault.modify(item.file, newContent)
			}
		} else {
			await this.app.vault.modify(item.file, taskContent.join("\n") + "\n" + content)
		}

		console.log(taskContent)
		new Notice("Task(s) migrated to " + item.filePath)
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
