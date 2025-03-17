/*
 * @Author       sleepingraven
 * @Date         2025-03-05 20:04:39
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-03-06 11:15:08
 * @FilePath     \hotkey-suit\src\ui\setting\examine\ExamineModal.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Modal, Notice, Setting } from "obsidian";
import { noop } from "ts-essentials";
import HotkeySuitPlugin from "main";
import { CommandMeta, CommandMetas } from "src/command/table/CommandMeta";
import { CommandNode, iterateCommandTree } from "src/command/table/CommandSuit";
import { HotkeyManagerDummy } from "src/common/HotkeysUtil";
import { Constants, ENV_VAR } from "src/common/Constants";
import { Consumer, ObjUtil, RecordUtil } from "src/common/ObjUtil";
import { AssignmentType } from "src/ui/setting/examine/Assignment";
import { SettingItemRenderer } from "src/ui/setting/examine/SettingItemRenderer";

type Helper = {
	readonly assignmentToIds: Readonly<Record<AssignmentType, Set<string>>>;
	updateAssignmentCnt: Consumer<AssignmentType>;
	readonly settingItemRenderer: SettingItemRenderer;
};
export class ExamineModal extends Modal {
	private readonly plugin: HotkeySuitPlugin;
	private readonly root: CommandNode;

	private helper: Helper;
	private commandCnt(ass: AssignmentType) {
		return this.helper.assignmentToIds[ass].size;
	}

	constructor(plugin: HotkeySuitPlugin, root: CommandNode) {
		super(plugin.app);
		this.plugin = plugin;
		this.root = root;
		this.setTitle("Core-supporting commands");
	}

	onOpen() {
		this.renderMyContent();
	}

	onClose() {
		this.cleanMyContent();
	}

	renderMyContent() {
		this.helper = {
			assignmentToIds: RecordUtil.newRecord(
				assignmentKeys,
				() => new Set()
			),
			updateAssignmentCnt: noop,
			settingItemRenderer: new SettingItemRenderer(this.plugin, {
				assignmentChanged: (id, to, from) => {
					const { updateAssignmentCnt, assignmentToIds } =
						this.helper;
					if (from !== undefined) {
						assignmentToIds[from].delete(id);
						updateAssignmentCnt(from);
					}
					assignmentToIds[to].add(id);
					updateAssignmentCnt(to);
				},
			}),
		};

		this.setContent(
			createFragment((doc) => {
				const el = doc.createDiv({
					cls: `${Constants.SETTING_CONTAINER_CLS}`,
				});

				const settingSupplier = () => new Setting(el);
				ENV_VAR.logDevMessage(
					() => `${HotkeyManagerDummy.getInstance(this.app)}`
				);
				iterateCommandTree(this.root, (p) => {
					const setting = settingSupplier().setHeading();
					if (p.title) {
						setting.setName(p.title);
					}
					let hasCommandsShowing = false;
					if (p.commands) {
						p.commands.forEach((c) => {
							hasCommandsShowing =
								this.iterateCommands(c, settingSupplier) ||
								hasCommandsShowing;
						});
					}
					if (!hasCommandsShowing) {
						setting.settingEl.addClass(Constants.DISPLAY_NONE_CLS);
					}
				});
				this.renderStickySettings(el);
			})
		);
	}

	cleanMyContent() {
		this.contentEl.empty();
		this.helper = undefined as any as typeof this.helper;
	}

	private iterateCommands(
		cm: CommandMeta,
		settingSupplier: () => Setting
	): boolean {
		if (!CommandMetas.requireSupported(cm)) {
			return false;
		}
		if (!CommandMetas.isDelegate(cm)) {
			return false;
		}

		const setting = settingSupplier();
		this.helper.settingItemRenderer.renderSettingItem(cm, setting);

		return true;
	}

	private renderStickySettings(el: HTMLDivElement) {
		el = el.createDiv({ cls: `${Constants.BASE_NAME}-modal-sticky` });
		const settingSupplier = () => new Setting(el);
		settingSupplier().setClass(
			`${Constants.BASE_NAME}-setting-item-around`
		);
		settingSupplier()
			.setDesc(
				createFragment((doc) => {
					const cnt = assignmentKeys
						.map<number>(this.commandCnt.bind(this))
						.reduce((a, b) => a + b, 0);
					doc.createSpan({ text: `Showing ${cnt} commands:` });
					doc.createEl("br");

					const summarizationEls = RecordUtil.newRecord(
						assignmentKeys,
						(key, idx, arr) => {
							const cntEl = doc.createSpan();
							const last = idx === arr.length - 1;
							doc.createSpan({
								text: ` ${summarizationText[key]}${
									!last ? ", " : "."
								}`,
							});
							return cntEl;
						}
					);
					this.helper.updateAssignmentCnt = (ass: AssignmentType) =>
						summarizationEls[ass].setText(
							this.commandCnt(ass).toString()
						);
					assignmentKeys.forEach(
						this.helper.updateAssignmentCnt.bind(this)
					);
				})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Assign / Restore")
					.setCta()
					.onClick(() => {
						const commandCnts: Readonly<
							Record<keyof typeof assignmentStateText, number>
						> = RecordUtil.newRecord(
							assignmentStateKeys,
							this.commandCnt.bind(this)
						);
						if (
							commandCnts["Assign"] + commandCnts["Restore"] ===
							0
						) {
							new Notice("No hotkey to assign / restore.");
							return;
						}

						const hotkeyManager = HotkeyManagerDummy.getInstance(
							this.app
						);
						this.helper.assignmentToIds["Assign"].forEach((id) =>
							hotkeyManager.setHotkeys(
								id,
								CommandMetas.cloneHotkeys(
									this.plugin.settings.selectedHotkeys[id] ??
										[]
								)
							)
						);
						this.helper.assignmentToIds["Restore"].forEach(
							(_, id) => hotkeyManager.removeHotkeys(id)
						);

						new Notice(
							createFragment((doc) => {
								assignmentStateKeys.forEach((ass, idx, arr) => {
									const hotkeysCnt = [
										...this.helper.assignmentToIds[
											ass
										].values(),
									]
										.map(
											(id) =>
												this.plugin.settings
													.selectedHotkeys[id]
										)
										.map((shks) => shks?.length ?? 1)
										.reduce((acc, c) => acc + c, 0);
									const last = idx === arr.length - 1;
									doc.createSpan({
										text: `${hotkeysCnt} hotkeys for ${commandCnts[ass]} commands ${assignmentStateText[ass]}`,
									});
									if (!last) {
										doc.createEl("br");
									}
								});
								doc.createEl("br");
								doc.createEl("br");

								doc.createSpan({
									text: "Don't forget to save changes at ",
								});
								doc.createEl("strong", {
									text: "Save hotkeys",
								});
								doc.createSpan({ text: " button." });
								doc.createEl("br");
								doc.createSpan({
									text: "It's auto saved if a change is made under ",
								});
								doc.createEl("strong", {
									text: "Settings → Options → Hotkeys",
								});
								doc.createSpan({ text: "." });
							}),
							0
						);
						this.close();
					})
			);
		settingSupplier().setClass(
			`${Constants.BASE_NAME}-setting-item-around`
		);
	}
}

const summarizationText: Readonly<Record<AssignmentType, string>> = {
	Assign: "to assign hotkeys",
	Restore: "to restore default",
	Ignore: "are ignored",
};
const assignmentStateText: Readonly<
	Record<Exclude<AssignmentType, "Ignore">, string>
> = {
	Assign: "assigned",
	Restore: "restored default",
};
const assignmentKeys: ReadonlyArray<keyof typeof summarizationText> =
	ObjUtil.keysOfEnum(summarizationText);
const assignmentStateKeys: ReadonlyArray<keyof typeof assignmentStateText> =
	ObjUtil.keysOfEnum(assignmentStateText);
