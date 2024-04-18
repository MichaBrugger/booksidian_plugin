import { Book } from "src/Book";

// Following rssParser example to avoid issue with: import * as Mustache from 'mustache';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Mustache = require("mustache");

export class Body {
	constructor(
		public currentBody: string,
		public book: Book,
	) {}

	public getBody(): string {
		const render = Mustache.render(this.currentBody, this.book) as string;

		return render.replaceAll("&#x2F;", "/");
	}
}
