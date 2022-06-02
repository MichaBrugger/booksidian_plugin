import { rssParser } from "const/rssParser";
import { GoodreadsBook } from "const/goodreads";
import { Book } from "./Book";
import Booksidian from "main";

export class Shelf {
	path: string;
	url: string;
	books: Book[] = [];

	constructor(public plugin: Booksidian, public shelfName: string) {
		this.path = `${plugin.settings.targetFolderPath}/`;
		this.url = `${plugin.settings.goodreadsBaseUrl}${shelfName}`;
	}

	private setBook(book: Book): void {
		this.books.push(book);
	}

	public getBooks(): Book[] {
		return this.books;
	}

	// create folder for each shelf (based on targetFolderPath)
	public async createFolder(): Promise<void> {
		try {
			await this.plugin.app.vault.createFolder(this.path);
		} catch (e) {
			if (e.message.includes("already exists")) return;
			console.warn(e);
		}
	}

	public async fetchGoodreadsFeed(): Promise<void> {
		try {
			const feed = await rssParser.parseURL(this.url);
			feed.items.forEach(async (_book: GoodreadsBook) => {
				const book = new Book(this.plugin, _book);
				this.setBook(book);
			});
		} catch (e) {
			console.warn(e);
		}
	}

	public createBookFiles(): void {
		this.getBooks().map((book) => book.createFile(book, this.path));
	}
}
