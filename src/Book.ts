import { CurrentYAML } from "const/settings";
import { GoodreadsBook } from "const/goodreads";
import Booksidian from "main";
import { Body } from "./Body";
import { Frontmatter } from "./Frontmatter";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TurndownService = require('turndown');

export class Book {
	id: string;
	pages: number;
	title: string;
	rawTitle: string;
	fullTitle: string;
	series: string;
	subtitle: string;
	description: string;
	author: string;
	isbn: string;
	review: string;
	rating: number;
	avgRating: number;
	shelves: string;
	dateAdded: string;
	dateRead: string;
	datePublished: string;
	cover: string;

	constructor(public plugin: Booksidian, book: GoodreadsBook) {
		this.id = book.identifiers.$.id;
		this.pages = parseInt(book.identifiers.num_pages[0]) || undefined;
		this.title = this.cleanTitle(book.title, false);
		this.rawTitle = book.title;
		this.fullTitle = this.cleanTitle(book.title, true);
		this.description = this.htmlToMarkdown(book.book_description);
		this.author = book.author;
		this.isbn = book.isbn;
		this.review = this.htmlToMarkdown(book.user_review || '');
		this.rating = parseInt(book.user_rating) || 0;
		this.avgRating = parseFloat(book.average_rating) || 0;
		this.dateAdded = this.parseDate(book.user_date_added);
		this.dateRead = this.parseDate(book.user_read_at);
		this.datePublished = this.parseDate(book.book_published);
		this.cover = book.image_url;
		this.shelves = this.getShelves(book.user_shelves, this.dateRead);
	}

	public getTitle(): string {
		return this.title;
	}

	public getContent(): string {
		const set = this.plugin.settings;
		try {
			return (
				this.getFrontMatter(set.frontmatterDictionary) +
				this.getBody(set.bodyString)
			);
		} catch (error) {
			console.log(error);
		}
	}

	private htmlToMarkdown(html: string) {
		const turndownService = new TurndownService()
		return turndownService.turndown(html)
	}

	private getShelves(shelves: string, dateRead: string) : string {
		// Goodreads doesn't send a shelf value for books on the read shelf.
		// Infer from either a missing shelf value, or a set dateRead.
		// Check for presence of read first in case Goodreads decides to include it.
		if (!shelves.toLowerCase().includes("read") && (!shelves || dateRead)) {
			return shelves ? `${this.shelves},read` : 'read';
		}

		return shelves;
	}

	private getBody(currentBody: string): string {
		return new Body(currentBody, this).getBody();
	}

	private getFrontMatter(currentYAML: CurrentYAML): string {
		if (Object.keys(currentYAML).length > 0) {
			return new Frontmatter(currentYAML, this).getFrontmatter();
		}
		return "";
	}

	public async createFile(book: Book, path: string): Promise<void> {
		const fileName = this.getBody(this.plugin.settings.fileName);
		const fullName = `${path}${fileName}.md`;

		try {
			const fs = this.plugin.app.vault.adapter;
			const fileAlreadyExists = await fs.exists(fullName);
			if (fileAlreadyExists && !this.plugin.settings.overwrite) {
				return;
			}

			// Either create new file or overwrite one that exists.
			await fs.write(fullName, book.getContent());
		} catch (error) {
			console.log(`Error writing ${fullName}`, error);
		}
	}

	private cleanTitle(title: string, full: boolean) {
		this.series = "";
		this.subtitle = "";
		let series = "";

		if (title.includes("(") && title.includes("#")) {
			series = this.getSeries(title);
		}

		title = title.replace(series, "");

		if (title.includes(":")) {
			this.getSubTitle(title);
		}

		if (!full) {
			title = title.split(":")[0];
		}

		// replace remaining special characters with an empty character
		title = title.replace(/[&\/\\#,+()$~%.'":*?<>{}|]/g,'');

		return title.trim();
	}

	private getSeries(title: string): string {
		const match = title.match(/\((.*?)\)/);
		if (match && match[1].contains("#")) {
			this.series = match[1].trim();
			return match[0];
		}
		return "";
	}

	private getSubTitle(title: string) {
		this.subtitle = title.split(":")[1].trim();
	}

	private parseDate(inputDate: string) {
		if (inputDate == "") {
			return "";
		}
		const date = new Date(inputDate);
		return date.toISOString().substring(0, 10);
	}
}
