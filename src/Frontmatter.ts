import { FRONTMATTER_LINES } from "const/frontmatter";
import { CurrentYAML } from "const/settings";
import { Book } from "src/Book";

export class Frontmatter {
	constructor(public currentYAML: CurrentYAML, public book: Book) {}

	public getFrontmatter(): string {
		return (
			FRONTMATTER_LINES +
			"\n" +
			this.getFrontmatterLines() +
			FRONTMATTER_LINES +
			"\n"
		);
	}

	private getFrontmatterLines(): string {
		const temp: string[] = [];
		Object.keys(this.currentYAML).forEach((key: string) => {
			const value = this.currentYAML[key];
			const prefix = value.split(key)[0];
			const postfix = value.split(key)[1];

			// this needs to be fixed, had some issues with the return data types
			if (key === "shelves") {
				const newString = this.book.shelves.split(",");
				temp.push(`${key}: `);
				for (let i = 0; i < newString.length; i++) {
					temp.push(`${prefix}${newString[i].trim()}${postfix}`);
				}
			} else {
				temp.push(
					`${key}: ${prefix}${this.book[key as keyof Book]}${postfix}`
				);
			}
		});
		return temp.join("\n") + "\n";
	}
}
