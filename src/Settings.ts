import { App, PluginSettingTab, Setting } from "obsidian";
import Booksidian from "../main";

export class Settings extends PluginSettingTab {
	plugin: Booksidian;
	currentYAML: { [key: string]: string };

	constructor(app: App, plugin: Booksidian) {
		super(app, plugin);
		this.plugin = plugin;
		this.currentYAML = plugin.settings.frontmatterDictionary;
	}

	getSelectedCount(): string {
		const selected = Object.keys(this.getYAML()).length;
		const total = 11;
		return `${selected}/${total}`;
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	private getYAML(): { [key: string]: string } {
		return this.currentYAML;
	}

	getDisplay(option: string): string {
		if (this.optionIsSelected(option)) {
			return "🟢 - " + option;
		}
		return "⚫ - " + option;
	}

	optionIsSelected(option: string): boolean {
		return this.currentYAML.hasOwnProperty(option);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h3", { text: "Goodreads RSS Feed" });
		containerEl.createEl("p", {
			text: "Only the first 100 items of a shelf are added to the RSS feed. So if you have more than 100 books, you have to split them into multiple shelves.",
		});

		// set the base url for all goodreads rss feeds
		new Setting(containerEl)
			.setName("RSS Base URL")
			.setDesc(
				"Please add your RSS Base URL here (everything before the shelf name)."
			)
			.setTooltip("https://www.goodreads.com/ ... &shelf=")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.goodreadsBaseUrl)
					.onChange(async (value) => {
						this.plugin.settings.goodreadsBaseUrl = value;
						await this.plugin.saveSettings();
					})
			);

		// set the goodreads shelves that should be exported
		new Setting(containerEl)
			.setName("Your Goodreads Shelves")
			.setDesc(
				"Here you can specify which shelves you'd like to export. Please separate the values with a comma and make sure you got the names right. "
			)
			.setTooltip("You can check the proper naming in the RSS url.")
			.addTextArea((textArea) =>
				textArea
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.goodreadsShelves)
					.onChange(async (value) => {
						this.plugin.settings.goodreadsShelves = value;
						await this.plugin.saveSettings();
					})
			);

		// set the target folder for the exports
		new Setting(containerEl)
			.setName("Target Folder")
			.setDesc(
				"If you leave this empty, the books will be created in folders in the root directory (one folder for each exported shelf)."
			)
			.addText((text) =>
				text
					.setPlaceholder("")
					.setValue(this.plugin.settings.targetFolderPath)
					.onChange(async (value) => {
						this.plugin.settings.targetFolderPath = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h3", { text: "Frontmatter" });

		new Setting(containerEl)
			.setName("Available Fields")

			.addDropdown((dropdown) =>
				dropdown
					.addOption("", `${this.getSelectedCount()}`)
					.addOption("tags", `${this.getDisplay("tags")}`)
					.addOption("cover", `${this.getDisplay("cover")}`)
					.addOption("title", `${this.getDisplay("title")}`)
					.addOption("author", `${this.getDisplay("author")}`)
					.addOption("isbn", `${this.getDisplay("isbn")}`)
					.addOption("rating", `${this.getDisplay("rating")}`)
					.addOption("avgRating", `${this.getDisplay("avgRating")}`)
					.addOption("dateAdded", `${this.getDisplay("dateAdded")}`)
					.addOption("dateRead", `${this.getDisplay("dateRead")}`)
					.addOption(
						"datePublished",
						`${this.getDisplay("datePublished")}`
					)
					.addOption("shelves", `${this.getDisplay("shelves")}`)
					.onChange(async (value: string) => {
						this.optionIsSelected(value)
							? delete this.currentYAML[value]
							: (this.currentYAML[value] = value);
						await this.plugin.saveSettings();
						this.display();
					})
			)
			.addExtraButton((button) =>
				button
					.onClick(async () => {
						this.display();
					})
					.setIcon("sync")
					.setTooltip("Refresh Previews")
			);

		if (Object.keys(this.currentYAML).length > 0) {
			containerEl.createEl("p", {
				text: "You can add custom frontmatter to your books. Please use the following format:",
			});
			containerEl.createEl("pre", {
				text: "key: value",
				attr: { style: "font-size: 12px; color: #999;" },
			});
		}

		Object.keys(this.currentYAML).forEach((key) => {
			const value = this.currentYAML[key];
			new Setting(containerEl)
				.setName(key + ": " + value)
				.addExtraButton(
					(button) =>
						button
							.onClick(async () => {
								if (value.startsWith("[[")) {
									this.currentYAML[key] = value.replace(
										/[[\]]/g,
										""
									);
								} else {
									this.currentYAML[key] = "[[" + value + "]]";
								}
								await this.plugin.saveSettings();
								this.display();
							})
							.setIcon("bracket-glyph").setTooltip
				)
				.addText((text) =>
					text
						.setPlaceholder("")
						.setValue(this.currentYAML[key])
						.onChange(async (value) => {
							this.currentYAML[key] = value;
							await this.plugin.saveSettings();
						})
				)
				.addExtraButton((button) =>
					button
						.onClick(async () => {
							delete this.currentYAML[key];
							await this.plugin.saveSettings();
							this.display();
						})
						.setIcon("trash")
						.setTooltip("Remove")
				);
		});
		containerEl.createEl("h3", { text: "Body" });

		// set the goodreads shelves that should be exported
		new Setting(containerEl)
			.setName("Content of the book-note")
			.setDesc(
				"Here you can specifiy the content of the book-note. You can use all the {{placeholders}} that are available in the frontmatter."
			)
			.setTooltip("Don't forget to warp the placeholders in {{}}.")
			.addTextArea((text) => {
				text.inputEl.rows = 6;
				text.inputEl.style.width = "100%";
				text.setValue(this.plugin.settings.bodyString);
				text.onChange(async (value) => {
					this.plugin.settings.bodyString = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
