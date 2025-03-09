import { CurrentYAML } from "const/settings";
import { GoodreadsBook } from "const/goodreads";
import Booksidian from "main";
import { Body } from "./Body";
import { Frontmatter } from "./Frontmatter";
import { isAbsolute } from "path";
import * as nodeFs from "fs";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TurndownService = require("turndown");

export class Book {
	id: string;
	pages: number;
	title: string;
	rawTitle: string;
	fullTitle: string;
	series: string;
	seriesName: string;
	seriesNumber: number;
	subtitle: string;
	description: string;
	author: string;
	isbn: string;
	review: string;
	rating: number;
	avgRating: number;
	shelves: string[];
	dateAdded: string;
	dateRead: string;
	datePublished: string;
	cover: string;
	bookPage: string;

	constructor(
		public plugin: Booksidian,
		book: GoodreadsBook,
	) {
		this.id = book.identifiers.$.id;
		this.pages = parseInt(book.identifiers.num_pages[0]) || undefined;
		this.title = this.cleanTitle(book.title, false);
		this.rawTitle = book.title;
		this.fullTitle = this.cleanTitle(book.title, true);
		this.description = this.htmlToMarkdown(book.book_description);
		this.author = book.author;
		this.isbn = book.isbn;
		this.review = this.htmlToMarkdown(book.user_review || "");
		this.rating = parseInt(book.user_rating) || 0;
		this.avgRating = parseFloat(book.average_rating) || 0;
		this.dateAdded = this.parseDate(book.user_date_added);
		this.dateRead = this.parseDate(book.user_read_at);
		this.datePublished = this.parseDate(book.book_published);
		this.cover = book.image_url;
		this.shelves = this.getShelves(book.user_shelves, this.dateRead);
		this.bookPage = `https://www.goodreads.com/book/show/${this.id}`;
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
		const turndownService = new TurndownService();
		return turndownService.turndown(html);
	}

	private getShelves(shelves: string, dateRead: string): string[] {
		// Goodreads doesn't send a shelf value for books on the read shelf.
		// Infer from either a missing shelf value, or a set dateRead.
		// Check for presence of read first in case Goodreads decides to include it.
		const outputShelves = shelves
			.split(",")
			.map((shelf) => shelf.trim()) // trim shelf names
			.filter((shelf) => shelf); // filter out empty shelf names

		// If the book has a read date and the `read` shelf is missing, we add it
		if (dateRead && !outputShelves.includes("read"))
			outputShelves.push("read");

		return outputShelves;
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
		const fullPath = `${path}/${fileName}.md`;

		const file = this.plugin.app.vault.getFileByPath(fullPath);
		if (file && !this.plugin.settings.overwrite) return;

		const bookContent = book.getContent();

		if (isAbsolute(fullPath)) {
			nodeFs.writeFile(fullPath, bookContent, (error) => {
				if (error) console.log(`Error writing ${fullPath}`, error);
			});
		} else {
			try {
				const fs = this.plugin.app.vault.adapter;
				await fs.write(fullPath, bookContent);
			} catch (error) {
				console.log(`Error writing ${fullPath}`, error);
			}
		}
	}

	private cleanTitle(title: string, full: boolean) {
		this.series = "";
		this.seriesName = "";
		this.seriesNumber = 0;
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
		title = title.replace(/[&\/\\#,+()$~%.'":*?<>{}|]/g, "");

		return title.trim();
	}

	private getSeries(title: string): string {
		// only calculate once per book
		if (this.series) {
			return this.series;
		}
		let match = title.match(/.+ \(((.+?),? #(\d+))\)/);

		if (match) {
			this.series = match[1].trim();
			this.seriesName = match[2].trim();
			this.seriesNumber = parseInt(match[3].trim(), 10);
			return `(${match[1]})`;
		}

		console.log(
			`New get series parser failed for "${title}", falling back to legacy parser.`,
		);

		// fallback to old method, this is mostly for backwards compatibility in case of edge cases
		match = title.match(/\((.*?)\)/);
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
