/*
 * @Author       sleepingraven
 * @Date         2025-01-25 14:27:45
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-01-29 00:17:48
 * @FilePath     \hotkey-suit\main.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { App, Editor, MarkdownView, Notice, Plugin, Hotkey } from "obsidian";
import {
	PluginSettings,
	DEFAULT_SETTINGS,
	SettingTab,
} from "src/ui/SettingTab";
import {
	CommandNode,
	instantiateRootCommandNode,
	CommandMetaDelegate,
} from "src/common/CommandTable";

export default class HotkeySuitPlugin extends Plugin {
	settings: PluginSettings;
	enabledIdToHotkeys: Map<string, Hotkey[]>;

	async onload() {
		await this.loadSettings();

		const root = instantiateRootCommandNode();
		this.initCommandNodes(root);

		const settingTab = new SettingTab(this.app, this, root);
		this.addSettingTab(settingTab);
	}

	initCommandNodes(root: CommandNode) {
		const doInitCommandNodes = (p: CommandNode) => {
			p.commands?.forEach((cm) => {
				const cmd = cm as CommandMetaDelegate;
				if (cmd.id && cmd._hks) {
					const command = CommandMetaDelegate.newCommandInstance(
						cmd,
						this.app,
						() => this.enabledIdToHotkeys.get(cmd.id)?.slice()
					);
					if (command) {
						this.addCommand(command);
					}
				}
			});

			p.children?.forEach(doInitCommandNodes.bind(this));
		};

		root.children?.forEach(doInitCommandNodes.bind(this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
		this.enabledIdToHotkeys = new Map<string, Hotkey[]>(
			this.settings.enabledIdToHotkeysEntries
		);
	}

	async saveSettings() {
		const mapArray = Array.from(this.enabledIdToHotkeys.entries());
		this.settings.enabledIdToHotkeysEntries = Array.from(mapArray);
		await this.saveData(this.settings);
	}
}
