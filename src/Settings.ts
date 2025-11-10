import { App, debounce, Notice, PluginSettingTab, Setting } from "obsidian";
import Booksidian from "../main";

const debouncedSaveSettings = debounce(
	(callback: () => void) => callback(),
	500,
	true,
);

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
		const total = 20;
		return `${selected}/${total}`;
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	private getYAML(): { [key: string]: string } {
		return this.currentYAML;
	}

	getDisplay(option: string, label?: string): string {
		label = label ? label : option;

		if (this.optionIsSelected(option)) {
			return "🟢 - " + label;
		}
		return "⚫ - " + label;
	}

	optionIsSelected(option: string): boolean {
		return this.currentYAML.hasOwnProperty(option);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h3", { text: "Goodreads RSS Feed" });

		// set the target folder for the exports
		new Setting(containerEl)
			.setName("Target Folder")
			.setDesc(
				"Path to where to store the book notes. Can be either a relative path within the vault, or absolute outside of the vault. If you leave this empty, the books will be created in the root of the vault.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Vault root")
					.setValue(this.plugin.settings.targetFolderPath)
					.onChange(async (value) => {
						this.plugin.settings.targetFolderPath = value
							.replace(
								/[\\/]+$/g, // matches any trailing slashes
								"",
							)
							.trim();
						await this.plugin.saveSettings();
					}),
			);

		// set the base url for all goodreads rss feeds
		new Setting(containerEl)
			.setName("RSS Base URL")
			.setDesc(
				"Please add your RSS Base URL here (everything before the shelf name).",
			)
			.setTooltip("https://www.goodreads.com/ ... &shelf=")
			.addText((text) => {
				text.setValue(this.plugin.settings.goodreadsBaseUrl)
					.setPlaceholder("https://www.goodreads.com/ ... &shelf=")
					.onChange(async (value) => {
						debouncedSaveSettings(async () => {
							const validPattern =
								/^https?:\/\/.*?\/review\/list_rss\/\d+\?key=[a-zA-Z0-9-_]+&shelf=/;

							const result = value.trim().match(validPattern);

							// Save the url only when it matches the pattern
							if (result) {
								this.plugin.settings.goodreadsBaseUrl =
									result[0];
								text.inputEl.value = result[0];
							} else if (value.trim().length === 0) {
								this.plugin.settings.goodreadsBaseUrl = "";
							} else {
								new Notice(
									"Booksidian: Could not parse RSS Base URL",
								);
								return;
							}

							await this.plugin.saveSettings();
						});
					});
				text.inputEl.style.minWidth = "18rem";
				text.inputEl.style.maxWidth = "18rem";
			});

		// set the goodreads shelves that should be exported
		new Setting(containerEl)
			.setName("Your Goodreads Shelves")
			.setDesc(
				"Here you can specify which shelves you'd like to export. Please separate the values with a comma and make sure you got the names right. ",
			)
			.setTooltip("You can check the proper naming in the RSS url.")
			.addTextArea((text) => {
				text.inputEl.rows = 6;
				text.setPlaceholder("Your Shelves")
					.setValue(this.plugin.settings.goodreadsShelves)
					.onChange(async (value) => {
						this.plugin.settings.goodreadsShelves = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Configure resync frequency")
			.setDesc(
				"If not set to manual, Booksidian will resync with Goodreads RSS at configured interval",
			)
			.addDropdown((dropdown) => {
				dropdown.addOption("0", "Manual");
				dropdown.addOption("60", "Every 1 hour");
				dropdown.addOption((12 * 60).toString(), "Every 12 hours");
				dropdown.addOption((24 * 60).toString(), "Every 24 hours");

				dropdown.setValue(this.plugin.settings.frequency);

				dropdown.onChange((newValue) => {
					this.plugin.settings.frequency = newValue;
					this.plugin.saveSettings();

					this.plugin.configureSchedule();
				});
			});

		new Setting(containerEl)
			.setName("Overwrite")
			.setDesc(
				"When syncing with Goodreads, overwrite existing notes. Modifications to notes will be lost, but changes from Goodreads will now be picked up.",
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.overwrite);

				toggle.onChange((newValue) => {
					this.plugin.settings.overwrite = newValue;
					this.plugin.saveSettings();
				});
			});

		containerEl.createEl("h4", { text: "Book covers" });

		new Setting(containerEl)
			.setName("Download covers")
			.setDesc(
				"Whether the cover image for each book should be downloaded",
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.coverDownload);
				toggle.onChange(
					async (value) =>
						(this.plugin.settings.coverDownload = value),
				);
			});

		new Setting(containerEl)
			.setName("Cover download folder")
			.setDesc(
				'Path to where the cover images should be downloaded to. Like Target Folder, the path can be relative to the vault or absolute outside of the vault. If left empty, a folder named "cover" will be created under Target Folder.',
			)
			.addText((text) => {
				text.setPlaceholder("Target Folder/cover");

				text.setValue(this.plugin.settings.coverDownloadLocation);
				text.onChange(async (value) => {
					this.plugin.settings.coverDownloadLocation = value.trim();
					await this.plugin.saveSettings();
				});
			});

		containerEl.createEl("h3", { text: "Body" });
		containerEl.createEl("p", {
			text: "You can specify the content of the book-note by using {{placeholders}}. You can see the full list of placeholders in the dropdown of the frontmatter. You can choose the frontmatter placeholders you'd like and apply specific formatting to each of them.",
		});

		// set the title of the book-note
		new Setting(containerEl)
			.setName("Naming Pattern")
			.setTooltip("You don't need to add '.md' to the filename")
			.addText((text) => {
				text.setValue(this.plugin.settings.fileName);
				text.onChange(async (value) => {
					this.plugin.settings.fileName = value;
					await this.plugin.saveSettings();
				});
			});

		// set the body content of the book-note
		new Setting(containerEl)
			.setName("Content of the book-note")
			.setTooltip("Don't forget to wrap the placeholders in {{}}.")
			.addTextArea((text) => {
				text.inputEl.rows = 6;
				text.setValue(this.plugin.settings.bodyString);
				text.onChange(async (value) => {
					this.plugin.settings.bodyString = value;
					await this.plugin.saveSettings();
				});
			});

		containerEl.createEl("h3", { text: "Frontmatter" });

		if (Object.keys(this.currentYAML).length > 0) {
			containerEl.createEl("p", {
				text: "You can add custom frontmatter to your books. Please use the dropdown to choose the frontmatter you'd like to add.",
			});
		}
		// 	containerEl.createEl("pre", {
		// 		text: "key: value",
		// 		attr: { style: "font-size: 12px; color: #999;" },
		// 	});
		// }

		new Setting(containerEl)
			.setName("Available Fields")

			.addDropdown((dropdown) =>
				dropdown
					.addOption("", `${this.getSelectedCount()}`)
					.addOption("id", `${this.getDisplay("id")}`)
					.addOption("author", `${this.getDisplay("author")}`)
					.addOption(
						"title",
						`${this.getDisplay("title", "title (formatted for filenames/links)")}`,
					)
					.addOption(
						"fullTitle",
						`${this.getDisplay("fullTitle", "fullTitle (formatted, includes subtitle)")}`,
					)
					.addOption("rawTitle", `${this.getDisplay("rawTitle")}`)
					.addOption("subtitle", `${this.getDisplay("subtitle")}`)
					.addOption("pages", `${this.getDisplay("pages")}`)
					.addOption("series", `${this.getDisplay("series")}`)
					.addOption("seriesName", `${this.getDisplay("seriesName")}`)
					.addOption(
						"seriesNumber",
						`${this.getDisplay("seriesNumber")}`,
					)
					.addOption(
						"description",
						`${this.getDisplay("description")}`,
					)
					.addOption("cover", `${this.getDisplay("cover")}`)
					.addOption("coverImage", `${this.getDisplay("coverImage")}`)
					.addOption("isbn", `${this.getDisplay("isbn")}`)
					.addOption("review", `${this.getDisplay("review")}`)
					.addOption("rating", `${this.getDisplay("rating")}`)
					.addOption("avgRating", `${this.getDisplay("avgRating")}`)
					.addOption("dateAdded", `${this.getDisplay("dateAdded")}`)
					.addOption(
						"dateCreated",
						`${this.getDisplay("dateCreated")}`,
					)
					.addOption("dateRead", `${this.getDisplay("dateRead")}`)
					.addOption(
						"datePublished",
						`${this.getDisplay("datePublished")}`,
					)
					.addOption("shelves", `${this.getDisplay("shelves")}`)
					.addOption("bookPage", `${this.getDisplay("bookPage")}`)
					.onChange(async (value: string) => {
						if (this.optionIsSelected(value)) {
							delete this.currentYAML[value];
						} else {
							if (value === "coverImage")
								// we want coverImage to default to a link
								this.currentYAML[value] = `[[${value}]]`;
							else this.currentYAML[value] = value;
						}
						await this.plugin.saveSettings();
						this.display();
					}),
			)
			.addExtraButton((button) =>
				button
					.onClick(async () => {
						this.display();
					})
					.setIcon("sync")
					.setTooltip("Refresh Previews"),
			);

		Object.keys(this.currentYAML).forEach((key) => {
			const value = this.currentYAML[key];
			new Setting(containerEl)
				.setName(key + ": " + value)
				.addExtraButton(
					(button) =>
						button
							.setTooltip("Convert to link")
							.onClick(async () => {
								if (value.startsWith("[[")) {
									this.currentYAML[key] = value.replace(
										/[[\]]/g,
										"",
									);
								} else {
									this.currentYAML[key] = "[[" + value + "]]";
								}
								await this.plugin.saveSettings();
								this.display();
							})
							.setIcon("bracket-glyph").setTooltip,
				)
				.addText((text) =>
					text
						.setPlaceholder("")
						.setValue(this.currentYAML[key])
						.onChange(async (value) => {
							this.currentYAML[key] = value;
							await this.plugin.saveSettings();
						}),
				)
				.addExtraButton((button) =>
					button
						.onClick(async () => {
							delete this.currentYAML[key];
							await this.plugin.saveSettings();
							this.display();
						})
						.setIcon("trash")
						.setTooltip("Remove"),
				);
		});
	}
}
