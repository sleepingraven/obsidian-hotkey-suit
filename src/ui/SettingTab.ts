/*
 * @Author       sleepingraven
 * @Date         2025-01-25 14:49:26
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-01-27 15:48:32
 * @FilePath     \hotkey-suit\src\ui\SettingTab.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {
	App,
	PluginSettingTab,
	Setting,
	Hotkey,
	ToggleComponent,
	Component,
} from "obsidian";
import HotkeySuitPlugin from "main";
import {
	CommandMetaDelegate,
	CommandNode,
	CommandMeta,
} from "src/common/CommandTable";
import { HotkeysUtil } from "src/common/CommandsUtil";
import { Constants } from "src/common/Constants";

export interface PluginSettings {
	displayNotSupported: boolean;
	enabledIdToHotkeysEntries: [string, Hotkey[]][];
}

export const DEFAULT_SETTINGS: PluginSettings = {
	displayNotSupported: false,
	enabledIdToHotkeysEntries: [],
};

export class SettingTab extends PluginSettingTab {
	plugin: HotkeySuitPlugin;
	root: CommandNode;

	constructor(app: App, plugin: HotkeySuitPlugin, root: CommandNode) {
		super(app, plugin);
		this.plugin = plugin;
		this.root = root;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass(`${Constants.BASE_NAME}-setting-container`);

		const settingSupplier = () => new Setting(containerEl);
		settingSupplier()
			.setName("Show not supported commands.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.displayNotSupported);
				toggle.onChange(async (value) => {
					this.plugin.settings.displayNotSupported = value;
					await this.plugin.saveSettings();
					this.display();
				});
			});
		const iterateCommandNodes = (p: CommandNode) => {
			const setting = settingSupplier().setHeading();
			if (p.title) {
				setting.setName(p.title);
			}
			if (p.commands) {
				const toggleGroup = new ToggleGroup();
				p.commands.forEach((c) => {
					this.iterateCommands(c, settingSupplier, toggleGroup);
				});
				const { subToggles } = toggleGroup;
				if (subToggles.get(false).size || subToggles.get(true).size) {
					setting.addToggle((toggle) => {
						toggleGroup.resetMainToggle(toggle, this.plugin);
					});
				}
			}

			p.children?.forEach(iterateCommandNodes.bind(this));
		};

		this.root.children?.forEach(iterateCommandNodes.bind(this));
	}

	private iterateCommands(
		cm: CommandMeta,
		settingSupplier: () => Setting,
		toggleGroup: ToggleGroup
	) {
		const cmd = cm as CommandMetaDelegate;
		if (cmd.id && cmd._hks) {
			cmd._hks.forEach((k, idx) => {
				const setting = settingSupplier();
				if (idx === 0) {
					setting.setName(cm.name);
				}
				const desc = createFragment((doc) => {
					doc.createSpan({
						text: "⌨: ",
					});
					HotkeysUtil.renderHotkey(k, doc);
				});
				setting.setDesc(desc).addToggle((toggle) => {
					const { enabledIdToHotkeys } = this.plugin;
					const hotkeys = enabledIdToHotkeys.get(cmd.id);
					const toggleValue = !!hotkeys?.some((hk) =>
						HotkeysUtil.sameHotkey(hk, k)
					);
					toggle.setValue(toggleValue);
					toggle.setDisabled(!cmd._hks).onChange(async (value) => {
						const { enabledIdToHotkeys } = this.plugin;
						const hotkeys = enabledIdToHotkeys.get(cmd.id);
						if (value) {
							if (hotkeys !== undefined) {
								hotkeys.push(k);
							} else {
								enabledIdToHotkeys.set(cmd.id, [k]);
							}
						} else {
							if (hotkeys?.length === 1) {
								enabledIdToHotkeys.delete(cmd.id);
							} else {
								if (hotkeys) {
									const hkIdx = HotkeysUtil.hotkeysIndexOf(
										hotkeys,
										k
									);
									if (hkIdx >= 0) {
										hotkeys.splice(hkIdx);
									}
								}
							}
						}

						const command = CommandMetaDelegate.newCommandInstance(
							cmd,
							this.app,
							() => enabledIdToHotkeys.get(cmd.id)?.slice()
						);
						if (command) {
							this.plugin.removeCommand(cmd.id);
							this.plugin.addCommand(command);
						}

						await this.plugin.saveSettings();

						toggleGroup.changeSub(toggle, value);
					});
					toggleGroup.addSub(toggle, toggleValue);
				});
			});
		} else {
			if (Constants.DISPLAY_NOT_SUPPORTED) {
				settingSupplier().setName(cm.name).setDesc("(Not Supported)");
			} else {
				if (!this.plugin.settings.displayNotSupported) {
					return;
				}
				settingSupplier().setName(
					createFragment((doc) => {
						if (Constants.STRIKETHROUGH_NOT_SUPPORTED) {
							doc.createEl("del", {
								text: cm.name,
							});
						} else {
							doc.createSpan({ text: cm.name });
						}
					})
				);
			}
		}
	}
}

class BooleanRecord<T> {
	readonly map: T[];

	constructor(booleanFunction: (key: boolean) => T) {
		this.map = [
			booleanFunction(BooleanRecord.intToBoolean(0)),
			booleanFunction(BooleanRecord.intToBoolean(1)),
		];
	}

	get(key: boolean) {
		return this.map[BooleanRecord.booleanToInt(key)];
	}

	private static booleanToInt(key: boolean) {
		return key ? 1 : 0;
	}

	private static intToBoolean(i: number) {
		return !!i;
	}
}

class ToggleGroup {
	readonly subToggles: BooleanRecord<Set<ToggleComponent>> =
		new BooleanRecord(() => new Set<ToggleComponent>());
	private mainToggle: ToggleComponent;

	addSub(toggle: ToggleComponent, value: boolean) {
		this.subToggles.get(value).add(toggle);
	}

	changeSub(toggle: ToggleComponent, value: boolean) {
		if (this.subToggles.get(false).size === (value ? 1 : 0)) {
			this.mainToggle.setValue(value);
		}
		this.subToggles.get(!value).delete(toggle);
		this.subToggles.get(value).add(toggle);
	}

	resetMainToggle(toggle: ToggleComponent, component: Component) {
		this.mainToggle = toggle;
		toggle.setValue(this.subToggles.get(false).size === 0);
		component.registerDomEvent(toggle.toggleEl, "click", () => {
			const value = toggle.getValue();
			this.subToggles.get(!value).forEach((t) => t.setValue(value));
		});
	}
}
