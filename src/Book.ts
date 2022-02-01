import { CurrentYAML } from "const/settings";
import { GoodreadsBook } from "const/goodreads";
import Booksidian from "main";
import { Body } from "./Body";
import { Frontmatter } from "./Frontmatter";

export class Book {
	id: string;
	pages: number;
	title: string;
	series: string;
	subtitle: string;
	author: string;
	isbn: string;
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
		this.title = this.cleanTitle(book.title);
		this.author = book.author;
		this.isbn = book.isbn;
		this.rating = parseInt(book.user_rating) || 0;
		this.avgRating = parseFloat(book.average_rating) || 0;
		this.shelves = book.user_shelves;
		this.dateAdded = this.parseDate(book.user_date_added);
		this.dateRead = this.parseDate(book.user_read_at);
		this.datePublished = this.parseDate(book.book_published);
		this.cover = book.image_url;
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
		try {
			await this.plugin.app.vault.create(
				`${path}/${fileName}.md`,
				book.getContent()
			);
		} catch (error) {
			console.log(book.getTitle() + " already exists!");
		}
	}

	private cleanTitle(title: string) {
		this.series = "";
		this.subtitle = "";
		let series = "";

		if (title.contains("(") && title.contains("#")) {
			series = this.getSeries(title);
		}

		title = title.replace(series, "");

		if (title.contains(":")) {
			this.getSubTitle(title);
		}

		title = title.split(":")[0];
		return title.replace(/[^a-zA-Z0-9 ]/g, "").trim();
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
