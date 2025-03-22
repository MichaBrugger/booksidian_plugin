import { isAbsolute, dirname } from "path";
import * as nodeFs from "fs";
import { App } from "obsidian";

export async function writeFile(path: string, content: string, app: App) {
	if (isAbsolute(path)) {
		nodeFs.writeFile(path, content, (error) => {
			if (error) console.log(`Error writing ${path}`, error);
		});
	} else {
		try {
			const fs = app.vault.adapter;
			await fs.write(path, content);
		} catch (error) {
			console.log(`Error writing ${path}`, error);
		}
	}
}

export async function writeBinaryFile(
	path: string,
	content: Uint16Array,
	overwrite = false,
) {
	const filePath = isAbsolute(path)
		? path
		: `${this.app.vault.adapter.basePath}/${path}`;

	if (nodeFs.existsSync(filePath) && !overwrite) return;

	const directory = dirname(filePath);
	if (!nodeFs.existsSync(directory)) nodeFs.mkdirSync(directory);

	try {
		nodeFs.writeFileSync(filePath, content, { encoding: "binary" });
	} catch (error) {
		console.log(`Error writing ${filePath}`, error);
	}
}
