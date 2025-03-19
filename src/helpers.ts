import { isAbsolute } from "path";
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
