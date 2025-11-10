import { Plugin } from "obsidian";
import { Shelf } from "src/Shelf";
import { Settings } from "src/settings/Settings";
import { BooksidianSettings, DEFAULT_SETTINGS } from "const/settings";

export default class Booksidian extends Plugin {
	settings: BooksidianSettings;
	scheduleInterval: null | number = null;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"bold-glyph",
			"Booksidian Sync",
			(evt: MouseEvent) => {
				this.updateLibrary();
			},
		);

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "booksidian-sync",
			name: "Booksidian Sync",
			callback: () => {
				this.updateLibrary();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new Settings(this.app, this));
	}

	updateLibrary() {
		this.settings.goodreadsShelves.split(",").forEach(async (_shelf) => {
			const shelf = new Shelf(this, _shelf.trim());
			await shelf.createFolder();
			await shelf.fetchGoodreadsFeed();
			await shelf.createBookFiles();
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async configureSchedule() {
		const minutes = parseInt(this.settings.frequency);
		const milliseconds = minutes * 60 * 1000; // minutes * seconds * milliseconds
		console.log(
			"Booksidian plugin: setting interval to ",
			milliseconds,
			"milliseconds",
		);
		window.clearInterval(this.scheduleInterval);
		this.scheduleInterval = null;
		if (!milliseconds) {
			// we got manual option
			return;
		}
		this.scheduleInterval = window.setInterval(
			() => this.updateLibrary(),
			milliseconds,
		);
		this.registerInterval(this.scheduleInterval);
	}
}
