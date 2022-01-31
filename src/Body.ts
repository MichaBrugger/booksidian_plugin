import { Book } from "src/Book";

export class Body {
	constructor(public currentBody: string, public book: Book) {}

	public getBody(): string {
		for (const key in this.book) {
			if (this.book.hasOwnProperty(key)) {
				const value = this.book[key as keyof Book] as string;
				this.currentBody = this.currentBody.replace(
					`{{${key}}}`,
					value
				);
			}
		}
		return this.currentBody;
	}
}
