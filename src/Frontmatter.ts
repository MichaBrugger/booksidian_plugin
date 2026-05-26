import { FRONTMATTER_LINES } from "const/frontmatter";
import { CurrentYAML } from "const/settings";
import { Book } from "src/Book";
import slugify from "@sindresorhus/slugify";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require("js-yaml");

export class Frontmatter {
	constructor(
		public currentYAML: CurrentYAML,
		public book: Book,
	) {}

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
		const output: { [key: string]: number | string | string[] } = {};

		Object.keys(this.currentYAML).forEach((key: string) => {
			const value = this.currentYAML[key];
			const [prefix, postfix] = value.split(key);

			if (key === "shelves") {
				const tagsOrPropertyKey = prefix === "#" ? "tags" : key;
				const values: number | string | string[] = [];

				this.book.shelves.sort().forEach((shelf) => {
					const sanitisedValue =
						prefix === "#" ? slugify(shelf) : shelf;
					values.push(`${prefix}${sanitisedValue}${postfix}`);
				});

				if (Array.isArray(output[tagsOrPropertyKey])) {
					output[tagsOrPropertyKey] = (
						output[tagsOrPropertyKey] as string[]
					).concat(values);
				} else {
					output[tagsOrPropertyKey] = values;
				}
			} else {
				// If this a simple link, and the value of the string is empty, don't insert [[]]

				if (
					value == `[[${key}]]` &&
					this.book[key as keyof Book] == ""
				) {
					output[key] = "";
				} else {
					const tagsOrPropertyKey = prefix === "#" ? "tags" : key;
					const value = this.book[key as keyof Book].toString();
					const sanitisedValue =
						prefix === "#" ? slugify(value) : value;
					if (Array.isArray(output[tagsOrPropertyKey])) {
						(output[tagsOrPropertyKey] as string[]).push(
							sanitisedValue.toString(),
						);
					} else if (prefix === "#") {
						output[tagsOrPropertyKey] = [
							`${prefix}${sanitisedValue}${postfix}`,
						];
					} else {
						output[tagsOrPropertyKey] =
							`${prefix}${sanitisedValue}${postfix}`;
					}
				}
			}
		});

		return yaml.dump(output);
	}
}

/**
 * Return `content` with its leading frontmatter block removed. If there is
 * no leading `---` fence, or the opening fence has no matching closing
 * fence (malformed), `content` is returned unchanged so body data is never
 * destroyed.
 */
export function stripFrontmatter(content: string): string {
	const opening = FRONTMATTER_LINES + "\n";
	if (!content.startsWith(opening)) return content;

	const lines = content.split("\n");
	for (let i = 1; i < lines.length; i++) {
		if (lines[i] === FRONTMATTER_LINES) {
			return lines.slice(i + 1).join("\n");
		}
	}
	return content;
}
