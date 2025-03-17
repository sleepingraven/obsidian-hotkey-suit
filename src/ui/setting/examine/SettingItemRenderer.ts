/*
 * @Author       sleepingraven
 * @Date         2025-03-08 13:58:34
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-03-09 20:08:49
 * @FilePath     \hotkey-suit\src\ui\setting\examine\SettingItemRenderer.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Setting, Hotkey } from "obsidian";
import { DeepReadonly, noop } from "ts-essentials";
import HotkeySuitPlugin from "main";
import { CommandMetaDelegateOrImplementor } from "src/command/table/CommandMeta";
import { CircularList } from "src/common/DataStructure";
import { HotkeyManagerDummy, HotkeysRenderer } from "src/common/HotkeysUtil";
import { Consumer } from "src/common/ObjUtil";
import { Badges, BadgeTypeEnum } from "src/ui/Badges";
import {
	AssignmentType,
	HotkeysAssignmentFromEnum,
	HotkeysAssignmentToEnum,
	CandidateAssignments,
} from "src/ui/setting/examine/Assignment";

type CallbackFns = {
	assignmentChanged: (
		id: string,
		to: AssignmentType,
		from?: AssignmentType
	) => void;
};
export class SettingItemRenderer {
	private readonly plugin: HotkeySuitPlugin;
	private readonly callbackFns: CallbackFns;

	constructor(plugin: HotkeySuitPlugin, callbackFns: CallbackFns) {
		this.plugin = plugin;
		this.callbackFns = callbackFns;
	}

	renderSettingItem(cms: CommandMetaDelegateOrImplementor, setting: Setting) {
		setting.setName(
			createFragment((doc) => {
				doc.createSpan({ text: cms.name });
			})
		);

		const hotkeyManager = HotkeyManagerDummy.getInstance(this.plugin.app);
		let hotkeys: DeepReadonly<Hotkey[]> | undefined;
		let from: HotkeysAssignmentFromEnum;
		if ((hotkeys = hotkeyManager.getHotkeys(cms.id)) !== undefined) {
			from = HotkeysAssignmentFromEnum.Custom;
		} else if (
			(hotkeys = hotkeyManager.getDefaultHotkeys(cms.id)) !== undefined
		) {
			from = HotkeysAssignmentFromEnum.Default;
		} else {
			from = HotkeysAssignmentFromEnum.Unset;
		}

		const badgesSupplier = () => new Badges(setting.controlEl);
		const badgesFrom = badgesSupplier();
		renderFromText[from](badgesFrom);
		this.renderHotkeys(hotkeys ?? [], badgesFrom, true);

		const selectedHotkeys =
			this.plugin.settings.selectedHotkeys[cms.id] ?? [];
		const to: HotkeysAssignmentToEnum = selectedHotkeys.length
			? HotkeysAssignmentToEnum.Specific
			: HotkeysAssignmentToEnum.None;

		const assInfo = CandidateAssignments.candidateAssignmentInfo({
			from,
			to,
			fromHotkeys: hotkeys,
			toHotkeys: selectedHotkeys,
		});
		if (!assInfo.length) {
			// Unreachable code
			const badgesA = badgesSupplier();
			badgesA.renderBadge("→", { type: BadgeTypeEnum.Backdrop });
		} else {
			type TypeArgumentDeclared<T> = T extends CircularList<infer U>
				? U
				: never;
			setting.addExtraButton((cb) => {
				const doChange = (
					prev?: TypeArgumentDeclared<typeof assInfo>
				) => {
					const curr = assInfo.current;
					cb.setIcon(curr.value.icon).setTooltip(curr.value.tooltip);
					this.callbackFns.assignmentChanged(
						cms.id,
						curr.key,
						prev?.key
					);
				};
				cb.setDisabled(assInfo.length === 1).onClick(() => {
					const prev = assInfo.current;
					assInfo.next();
					doChange(prev);
				});
				doChange();
			});
		}

		const badgesTo = badgesSupplier();
		this.renderHotkeys(selectedHotkeys, badgesTo, false);
	}

	private renderHotkeys(
		hotkeys: DeepReadonly<Hotkey[]>,
		badges: Badges,
		from: boolean
	) {
		HotkeysRenderer.hotkeysTexts(hotkeys).forEach((text) =>
			badges.renderBadge(text, {
				tooltipParams: {
					tooltip: `${from ? "Current" : "Suit"} hotkey`,
				},
			})
		);
	}
}

const renderFromText: Readonly<
	Record<HotkeysAssignmentFromEnum, Consumer<Badges>>
> = {
	[HotkeysAssignmentFromEnum.Custom]: (badgesFrom) =>
		badgesFrom.renderBadge("(Custom)", {
			type: BadgeTypeEnum.Backdrop,
			tooltipParams: { tooltip: "Assigned by me" },
		}),
	[HotkeysAssignmentFromEnum.Default]: (badgesFrom) =>
		badgesFrom.renderBadge("(Default)", {
			type: BadgeTypeEnum.Backdrop,
			tooltipParams: { tooltip: "Unassigned" },
		}),
	[HotkeysAssignmentFromEnum.Unset]: noop,
};
