export interface BooksidianSettings {
	targetFolderPath: string;
	goodreadsBaseUrl: string;
	goodreadsShelves: string[];
	fileName: string;
	frontmatterDictionary: CurrentYAML;
	bodyString: string;
	frequency: string;
	overwrite: boolean;
	onlyFrontmatter: boolean;
}

export interface CurrentYAML {
	[key: string]: string;
}

export const DEFAULT_SETTINGS: BooksidianSettings = {
	targetFolderPath: "",
	fileName: "{{title}}",
	goodreadsBaseUrl: "https://www.goodreads.com/review/list_rss/...",
	goodreadsShelves: ["to-read","currently-reading","read"],
	frontmatterDictionary: {},
	bodyString: "# {{title}}\n\nauthor::[[{{author}}]]",
	frequency: "0", // manual
	overwrite: false,
	onlyFrontmatter: false,
};
