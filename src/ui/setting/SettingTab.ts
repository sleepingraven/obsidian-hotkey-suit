/*
 * @Author       sleepingraven
 * @Date         2025-01-25 14:49:26
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-01-27 15:48:32
 * @FilePath     \hotkey-suit\src\ui\setting\SettingTab.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { App, PluginSettingTab, Setting, Hotkey } from "obsidian";
import { DeepReadonly, SafeDictionary, ValueOf, Writable } from "ts-essentials";
import HotkeySuitPlugin from "main";
import { CommandMeta, CommandMetas } from "src/command/table/CommandMeta";
import { CommandNode, iterateCommandTree } from "src/command/table/CommandSuit";
import {
	HotkeyManagerDummy,
	HotkeysUtil,
	HotkeysRenderer,
} from "src/common/HotkeysUtil";
import { Constants } from "src/common/Constants";
import { Consumer } from "src/common/ObjUtil";
import { ToggleGroup } from "src/ui/ToggleGroup";
import { ExamineModal } from "src/ui/setting/examine/ExamineModal";
import { Badges } from "src/ui/Badges";
import { modifierFilter } from "src/common/HotkeyMap";

export interface PluginSettings {
	displayNotSupported: boolean;
	symbolizeKeys: boolean;
	delegateCoreCommands: boolean;
	readonly selectedHotkeys: DeepReadonly<SafeDictionary<Hotkey[]>>;
}

type SelectedHotkeysWritable = SafeDictionary<
	Writable<ValueOf<PluginSettings["selectedHotkeys"]>>
>;
function editSelectedHotkeys(
	selectedHotkeys: PluginSettings["selectedHotkeys"],
	consumer: Consumer<SelectedHotkeysWritable>
) {
	const writable = selectedHotkeys as SelectedHotkeysWritable;
	consumer(writable);
}

export const DEFAULT_SETTINGS: PluginSettings = {
	displayNotSupported: false,
	symbolizeKeys: false,
	delegateCoreCommands: false,
	selectedHotkeys: {},
};

export class SettingTab extends PluginSettingTab {
	private readonly plugin: HotkeySuitPlugin;
	private readonly root: CommandNode;
	private examineModal: ExamineModal;

	constructor(app: App, plugin: HotkeySuitPlugin, root: CommandNode) {
		super(app, plugin);
		this.plugin = plugin;
		this.root = root;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass(Constants.SETTING_CONTAINER_CLS);

		const settingSupplier = () => new Setting(containerEl);
		this.renderGeneralSettings(settingSupplier);
		iterateCommandTree(this.root, (p) => {
			const setting = settingSupplier().setHeading();
			if (p.title) {
				setting.setName(p.title);
			}
			let hasCommandsShowing = false;
			if (p.commands) {
				const toggleGroup = new ToggleGroup();
				p.commands.forEach((c) => {
					hasCommandsShowing =
						this.iterateCommands(c, settingSupplier, toggleGroup) ||
						hasCommandsShowing;
				});
				const { subToggles } = toggleGroup;
				if (subToggles.get(false).size || subToggles.get(true).size) {
					setting.addToggle((toggle) => {
						toggleGroup.resetMainToggle(toggle, this.plugin);
					});
				}
			}
			if (!hasCommandsShowing) {
				setting.settingEl.addClass(Constants.DISPLAY_NONE_CLS);
			}
		});
	}

	private renderGeneralSettings(settingSupplier: () => Setting) {
		settingSupplier()
			.setName("Show not supported commands")
			.setDesc(
				"Show commands that is neither supported by Obsidian core nor by this plugin."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.displayNotSupported)
					.onChange(async (value) => {
						this.plugin.settings.displayNotSupported = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		settingSupplier()
			.setName("Symbolize keys")
			.setDesc(
				createFragment((doc) => {
					doc.createSpan({ text: "Show keys in a form like " });
					doc.createEl("kbd", {
						text: modifierFilter.get(true)["Shift"],
					});
					doc.createSpan({ text: " instead of " });
					doc.createEl("kbd", {
						text: modifierFilter.get(false)["Shift"],
					});
					doc.createSpan({ text: "." });
				})
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.symbolizeKeys)
					.onChange(async (value) => {
						this.plugin.settings.symbolizeKeys = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		settingSupplier()
			.setName("Wrap core commands")
			.setDesc(
				createFragment((doc) => {
					doc.createSpan({
						text: "Wrap Obsidian-core-supporting commands to new commands with selecting hotkeys as default.",
					});
					doc.createEl("br");
					doc.createSpan({
						text: "Examine to set hotkeys directly.",
					});
				})
			)
			/*
			.addExtraButton((btn) => {
				btn.setIcon("check-check")
					.setTooltip("Save hotkeys")
					.onClick(async () => {
						const hotkeyManager = HotkeyManagerDummy.getInstance(
							this.app
						);
						await hotkeyManager.save();
					});
			})
			*/
			.addExtraButton((btn) => {
				btn.setIcon("list-tree")
					.setTooltip("Examine")
					.onClick(() => {
						(this.examineModal = new ExamineModal(
							this.plugin,
							this.root
						)).open();
					});
			})
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.delegateCoreCommands)
					.onChange(async (value) => {
						this.plugin.settings.delegateCoreCommands = value;
						await this.plugin.saveSettings();
						iterateCommandTree(this.root, (p) => {
							p.commands?.forEach((cm) => {
								if (CommandMetas.requireSupported(cm)) {
									if (CommandMetas.isDelegate(cm)) {
										if (value) {
											const command =
												CommandMetas.newCommandInstance(
													this.app,
													cm,
													this.plugin.settings
														.selectedHotkeys[cm.id]
												);
											if (command) {
												this.plugin.removeCommand(
													cm.id
												);
												this.plugin.addCommand(command);
											}
										} else {
											this.plugin.removeCommand(cm.id);
										}
									}
								}
							});
						});
					});
			});
	}

	private iterateCommands(
		cm: CommandMeta,
		settingSupplier: () => Setting,
		toggleGroup: ToggleGroup
	): boolean {
		if (CommandMetas.requireSupported(cm)) {
			cm._hks.forEach((hk, idx) => {
				const setting = settingSupplier();
				if (idx === 0) {
					setting.setName(
						createFragment((doc) => {
							doc.createSpan({ text: cm.name });
							const badges = new Badges(doc);
							if (CommandMetas.isDelegate(cm)) {
								renderByCore(badges);
							} else {
								checkToRenderByThisPlugin(cm, badges);
								checkToRenderByAnotherPlugin(cm, badges);
							}
						})
					);
				}
				setting
					.setDesc(
						createFragment((doc) => {
							doc.createSpan({ text: "⌨: " });
							HotkeysRenderer.renderHotkey(
								hk,
								doc,
								this.plugin.settings.symbolizeKeys
							);
						})
					)
					.addToggle((toggle) => {
						const selected = !!this.plugin.settings.selectedHotkeys[
							cm.id
						]?.some((shk) => HotkeysUtil.sameHotkey(shk, hk));
						toggle.setValue(selected).onChange(async (value) => {
							const { selectedHotkeys } = this.plugin.settings;

							editSelectedHotkeys(selectedHotkeys, (shks) => {
								if (value) {
									(shks[cm.id] ??= []).push(hk);
								} else {
									const hotkeys = shks[cm.id];
									if (hotkeys) {
										if (
											hotkeys.length === 1 &&
											HotkeysUtil.sameHotkey(
												hotkeys[0],
												hk
											)
										) {
											delete shks[cm.id];
										} else {
											HotkeysUtil.removeHotkey(
												hotkeys,
												hk
											);
										}
									}
								}
							});

							const addCommand =
								this.plugin.settings.delegateCoreCommands ||
								!CommandMetas.isDelegate(cm);
							if (addCommand) {
								const command = CommandMetas.newCommandInstance(
									this.app,
									cm,
									selectedHotkeys[cm.id]
								);
								if (command) {
									this.plugin.removeCommand(cm.id);
									this.plugin.addCommand(command);
								}
							}

							await this.plugin.saveSettings();

							toggleGroup.changeSub(toggle, value);
						});
						toggleGroup.addSub(toggle, selected);
					});
			});
		} else {
			if (!this.plugin.settings.displayNotSupported) {
				return false;
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
					const badges = new Badges(doc);
					checkToRenderByAnotherPlugin(cm, badges);
				})
			);
		}

		return true;
	}
}

function renderByCore(badges: Badges) {
	badges.renderBadge("Core", {
		tooltipParams: { tooltip: "Supports by Obsidian core" },
	});
}
function checkToRenderByThisPlugin(cm: CommandMeta, badges: Badges) {
	if (cm._flags?.hasKey("Implemented")) {
		badges.renderBadge("Implemented", {
			tooltipParams: {
				tooltip: "Supports by this plugin",
			},
		});
	}
}
function checkToRenderByAnotherPlugin(cm: CommandMeta, badges: Badges) {
	if (cm._flags?.hasKey("ByAnotherPlugin")) {
		badges.renderBadge("Other plugins", {
			tooltipParams: {
				tooltip: "Appears in other community plugins",
			},
		});
	}
}
