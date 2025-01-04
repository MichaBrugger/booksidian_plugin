import { App, PluginSettingTab, Setting } from "obsidian";
import Booksidian from "../main";
import { DEFAULT_SETTINGS } from "../const/settings";
import { ToggleComponent } from "obsidian";

// Toggler type with a string and a ToggleComponent
type Toggler = {
	label: string;
	toggle: ToggleComponent;
};


export class Settings extends PluginSettingTab {
	plugin: Booksidian;
	currentYAML: { [key: string]: string };
	togglers: Toggler[];

	constructor(app: App, plugin: Booksidian) {
		super(app, plugin);
		this.plugin = plugin;
		this.currentYAML = plugin.settings.frontmatterDictionary;
		this.togglers = [];
	}

	getSelectedCount(): string {
		const selected = Object.keys(this.getYAML()).length;
		const total = 18;
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
		containerEl.createEl("p", {
			text: "Only the first 100 items of a shelf are added to the RSS feed. So if you have more than 100 books, you have to split them into multiple shelves.",
		});

		// set the target folder for the exports
		new Setting(containerEl)
			.setName("Target Folder")
			.setDesc(
				"Path to where to store the book notes. Can be either a relative path within the vault, or absolute outside of the vault. If you leave this empty, the books will be created in the root directory.",
			)
			.addText((text) =>
				text
					.setPlaceholder("")
					.setValue(this.plugin.settings.targetFolderPath)
					.onChange(async (value) => {
						this.plugin.settings.targetFolderPath = value.replace(
							/[\\/]+$/g, // matches any trailing slashes
							"",
						);
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
			.addText((text) =>
				text
					.setValue(this.plugin.settings.goodreadsBaseUrl)
					.onChange(async (value) => {
						this.plugin.settings.goodreadsBaseUrl = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl).setHeading().setName("Goodreads Shelves");

		
		for (const shelf of DEFAULT_SETTINGS.goodreadsShelves){
			console.log(shelf);
			new Setting(containerEl).addToggle((toggle) => {
				this.togglers.push({label: shelf, toggle: toggle});

				toggle.setValue(this.plugin.settings.goodreadsShelves.includes(shelf));

				toggle.onChange(async (newValue) => {

					const hasValue: boolean = this.plugin.settings.goodreadsShelves.includes(shelf);
					if (newValue) {
						if(!hasValue) {
						this.plugin.settings.goodreadsShelves.push(shelf);
						}
					} else {
						if (hasValue){
							this.plugin.settings.goodreadsShelves = this.plugin.settings.goodreadsShelves.filter(s => s !== shelf);
						}		
					}

					console.log(this.plugin.settings.goodreadsShelves);

					await this.plugin.saveSettings();
				});
			}).setName(shelf)//.setDesc(shelf);
	}


		// set the goodreads shelves that should be exported
		new Setting(containerEl)
			.setName("Your Custom Goodreads Shelves")
			.setDesc(
				"Here you can specify which shelves you'd like to export. Please separate the values with a NEWLINE and make sure you got the names right. ",
			)
			.setTooltip("You can check the proper naming in the RSS url.")
			.addTextArea((text) => {
				text.inputEl.rows = 6;
				text.setPlaceholder("Your Shelves");
				text.setValue(
					this.plugin.settings.goodreadsShelves
						.filter((shelf) => !DEFAULT_SETTINGS.goodreadsShelves.includes(shelf))
						.join("\n")
				);

				const textFiledHandler = async () => {
					const value = text.getValue();
					// Get new shelves from textarea
					const valueArray = value.split("\n").map((shelf) => shelf.trim()).filter((shelf) => shelf.length > 0);
					
					const shelfArray = [... new Set(valueArray)]
					
					
					for (const ds of DEFAULT_SETTINGS.goodreadsShelves){
						const toggler = this.togglers.find((toggler) => toggler.label === ds);
						if (shelfArray.includes(ds) ){
							
							if (toggler.toggle.getValue() === false){
								toggler.toggle.setValue(true);
							} 
					} 
				}

				const defaultShelves = this.plugin.settings.goodreadsShelves.filter((shelf) => !DEFAULT_SETTINGS.goodreadsShelves.includes(shelf));
					
				const newArray = [...valueArray, ...defaultShelves]

				// Remove duplicates
				const newShelves = [...new Set(newArray)]
				console.log("SET:",newShelves);

				const customShelves = newShelves.filter((shelf) => !DEFAULT_SETTINGS.goodreadsShelves.includes(shelf));

				console.log("WHAT",customShelves)
					text.setValue(customShelves.join("\n"));

					this.plugin.settings.goodreadsShelves = newShelves;
					// Add new shelves
					// this.plugin.settings.goodreadsShelves.push(...newShelves);
					
					await this.plugin.saveSettings();
				}

				
				text.inputEl.addEventListener("blur", async () => {
					console.log("blur");
					await textFiledHandler();
				});

				text.inputEl.addEventListener("keydown", async (event) => {
					// If the key is Enter
					if (event.key === "Enter") {
					console.log("Enter");
					await textFiledHandler();
				}
				});

				text.onChange(async (value) => {
					//
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

			new Setting(containerEl)
			.setName("Only overwrite frontmatter")
			.setDesc(
				"If 'Overwrite' is enabled, only overwrite the frontmatter of existing notes. This will keep the body of the note intact.",
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.onlyFrontmatter);

				toggle.onChange((newValue) => {
					this.plugin.settings.onlyFrontmatter = newValue;
					this.plugin.saveSettings();
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
					.addOption(
						"description",
						`${this.getDisplay("description")}`,
					)
					.addOption("cover", `${this.getDisplay("cover")}`)
					.addOption("isbn", `${this.getDisplay("isbn")}`)
					.addOption("review", `${this.getDisplay("review")}`)
					.addOption("rating", `${this.getDisplay("rating")}`)
					.addOption("avgRating", `${this.getDisplay("avgRating")}`)
					.addOption("dateAdded", `${this.getDisplay("dateAdded")}`)
					.addOption("dateRead", `${this.getDisplay("dateRead")}`)
					.addOption(
						"datePublished",
						`${this.getDisplay("datePublished")}`,
					)
					.addOption("shelves", `${this.getDisplay("shelves")}`)
					.addOption("bookPage", `${this.getDisplay("bookPage")}`)
					.onChange(async (value: string) => {
						this.optionIsSelected(value)
							? delete this.currentYAML[value]
							: (this.currentYAML[value] = value);
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
