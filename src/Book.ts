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
	shelves: string[] = [];
	dateAdded: string;
	dateRead: string;
	datePublished: string;
	cover: string;

	constructor(public plugin: Booksidian, book: GoodreadsBook) {
		this.id = book.identifiers.$.id;
		this.pages = parseInt(book.identifiers.num_pages[0]) || undefined;
		this.title = this.cleanTitle(book.title);
		this.series = this.getSeries(book.title);
		this.subtitle = this.getSubTitle(book.title);
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
		try {
			return this.getFrontMatter() + this.getBody();
		} catch (error) {
			console.log(error);
		}
		return this.getFrontMatter(); // + this.getBody();
	}

	private getBody(): string {
		const currentBody = this.plugin.settings.bodyString;

		// if (currentBody.length > 0) {
		// 	return new Body(currentBody, this).getBody();
		// }
		// return "";
		return new Body(currentBody, this).getBody();
	}

	private getFrontMatter(): string {
		const currentYAML = this.plugin.settings.frontmatterDictionary;

		if (Object.keys(currentYAML).length > 0) {
			return new Frontmatter(currentYAML, this).getFrontmatter();
		}
		return "";
	}

	public async createFile(book: Book, path: string): Promise<void> {
		try {
			await this.plugin.app.vault.create(
				`${path}/${book.getTitle()}.md`,
				book.getContent()
			);
		} catch (error) {
			console.log(book.getTitle() + " already exists!");
		}
	}

	private cleanTitle(title: string): string {
		return title.replace(/[^a-zA-Z0-9 ]/g, "").trim();
	}

	private getSeries(title: string): string {
		const match = title.match(/\((.*?)\)/);
		return match ? match[1] : "";
	}

	private getSubTitle(title: string): string {
		return title.replace(/\(.*?\)/, "").split(":")[1];
	}

	private parseDate(inputDate: string) {
		if (inputDate == "") {
			return "";
		}
		const date = new Date(inputDate);
		return date.toISOString().substring(0, 10);
	}
}
