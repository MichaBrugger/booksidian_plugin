import { rssParser } from "const/rssParser";
import { GoodreadsBook } from "const/goodreads";
import { Book } from "./Book";
import Booksidian from "main";
import { Notice } from "obsidian";
import * as nodeFs from "fs";
import { isAbsolute } from "path";

export class Shelf {
	path: string;
	url: string;
	books: Book[] = [];

	constructor(
		public plugin: Booksidian,
		public shelfName: string,
	) {
		this.path = `${plugin.settings.targetFolderPath}`;
		this.url = `${plugin.settings.goodreadsBaseUrl}${shelfName.toLocaleLowerCase()}`;
	}

	private setBook(book: Book): void {
		this.books.push(book);
	}

	public getBooks(): Book[] {
		return this.books;
	}

	// create folder for each shelf (based on targetFolderPath)
	public async createFolder(): Promise<void> {
		if (isAbsolute(this.path)) {
			nodeFs.mkdir(this.path, { recursive: true }, (err) => {
				if (err) console.log(err);
			});
		} else {
			try {
				await this.plugin.app.vault.createFolder(this.path);
			} catch (e) {
				if (e.message.includes("already exists")) return;
				console.warn(e);
			}
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

	public async createBookFiles(): Promise<void> {
		await Promise.all([
			this.getBooks().map((book) => book.createFile(book, this.path)),
		]);
		this.createNotice();
	}

	private createNotice() {
		const syncCount: number = this.getBooks().length;

		if (syncCount === 0) {
			return;
		}

		const firstTitle = this.getBooks()[0].rawTitle;
		let noticeMsg = "";

		if (syncCount === 1) {
			noticeMsg = `${firstTitle} synced from Goodreads!`;
		} else {
			noticeMsg = `${this.getBooks().length} books, including ${firstTitle}, synced from Goodreads!`;
		}

		new Notice(noticeMsg, 5000);
	}
}
