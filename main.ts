/*
 * @Author       sleepingraven
 * @Date         2025-01-25 14:27:45
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-01-29 00:17:48
 * @FilePath     \hotkey-suit\main.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Plugin } from "obsidian";
import {
	PluginSettings,
	DEFAULT_SETTINGS,
	SettingTab,
} from "src/ui/setting/SettingTab";
import { CommandMetas } from "src/command/table/CommandMeta";
import {
	CommandNode,
	instantiateRootCommandNode,
	iterateCommandTree,
} from "src/command/table/CommandSuit";

export default class HotkeySuitPlugin extends Plugin {
	private _settings: PluginSettings;

	get settings() {
		return this._settings;
	}

	async onload() {
		await this.loadSettings();

		const root = instantiateRootCommandNode();
		this.initCommandNodes(root);

		const settingTab = new SettingTab(this.app, this, root);
		this.addSettingTab(settingTab);
	}

	private initCommandNodes(root: CommandNode) {
		iterateCommandTree(root, (p) => {
			p.commands?.forEach((cm) => {
				if (CommandMetas.requireSupported(cm)) {
					const addCommand =
						this._settings.delegateCoreCommands ||
						!CommandMetas.isDelegate(cm);
					if (addCommand) {
						const command = CommandMetas.newCommandInstance(
							this.app,
							cm,
							this._settings.selectedHotkeys[cm.id]
						);
						if (command) {
							this.addCommand(command);
						}
					}
				}
			});
		});
	}

	onunload() {}

	async loadSettings() {
		this._settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this._settings);
	}
}
