import { rssParser } from "const/rssParser";
import { GoodreadsBook } from "const/goodreads";
import { Book } from "./Book";
import Booksidian from "main";
import { Notice } from "obsidian";
import * as nodeFs from "fs";
import { isAbsolute } from "path";
import { pathExist, writeBinaryFile } from "./helpers";
import { get } from "https";

export class Shelf {
	path: string;
	url: string;
	books: Book[] = [];

	constructor(
		public plugin: Booksidian,
		public shelfName: string,
	) {
		const targetFolder = plugin.settings.targetFolderPath;
		this.path = targetFolder === "" ? "./" : targetFolder;

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
			let page = 1;
			while (true) {
				const pagedUrl = `${this.url}&page=${page}&per_page=100`;
				const feed = await rssParser.parseURL(pagedUrl);

				if (!feed.items) break;

				for (const _book of feed.items as GoodreadsBook[]) {
					const book = new Book(this.plugin, _book);
					book.coverImage = await this.fetchCoverImage(
						book.cover,
						book.id,
					);
					this.setBook(book);
				}
				page++;
				if (!feed.items.length) break;
			}
		} catch (e) {
			console.warn(e);
		}
	}

	private async fetchCoverImage(url: string, title: string) {
		if (!this.plugin.settings.coverDownload) return;

		let coverDownloadLocation = this.plugin.settings.coverDownloadLocation;

		if (coverDownloadLocation === "")
			coverDownloadLocation = `${this.plugin.settings.targetFolderPath || "."}/cover`;

		const fullPath = `${coverDownloadLocation}/${title}.jpg`;

		if (pathExist(fullPath)) return fullPath;

		get(url, (response) => {
			response.setEncoding("binary");

			let rawData = new Uint16Array();
			response.on("data", (chunk) => (rawData += chunk));
			response.on("end", () => writeBinaryFile(fullPath, rawData));
		});

		return fullPath;
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
