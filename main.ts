import { Plugin } from "obsidian";
import { Shelf } from "src/Shelf";
import { Settings } from "src/Settings";
import { BooksidianSettings, DEFAULT_SETTINGS } from "const/settings";

export default class Booksidian extends Plugin {
	settings: BooksidianSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"bold-glyph",
			"Booksidian Sync",
			(evt: MouseEvent) => {
				this.updateLibrary();
			}
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new Settings(this.app, this));
	}

	updateLibrary() {
		this.settings.goodreadsShelves.split(",").forEach(async (_shelf) => {
			const shelf = new Shelf(this, _shelf.trim());
			await shelf.createFolder();
			await shelf.fetchGoodreadsFeed();
			shelf.createBookFiles();
		});
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
