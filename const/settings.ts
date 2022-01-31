export interface BooksidianSettings {
	targetFolderPath: string;
	goodreadsBaseUrl: string;
	goodreadsShelves: string;
	frontmatterDictionary: CurrentYAML;
	bodyString: string;
}

export interface CurrentYAML {
	[key: string]: string;
}

export const DEFAULT_SETTINGS: BooksidianSettings = {
	targetFolderPath: "",
	goodreadsBaseUrl: "https://www.goodreads.com/review/list_rss/...",
	goodreadsShelves: "currently-reading",
	frontmatterDictionary: {},
	bodyString: "# {{title}}\n\n[[{{author}}]]",
};
