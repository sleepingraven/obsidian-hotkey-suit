/*
 * @Author       sleepingraven
 * @Date         2025-03-10 11:26:34
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-03-10 11:26:50
 * @FilePath     \hotkey-suit\src\ui\setting\examine\Assignment.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Hotkey, IconName } from "obsidian";
import { DeepReadonly, SafeDictionary } from "ts-essentials";
import { CircularList, KeyFlags } from "src/common/DataStructure";
import {
	EntryObjForType,
	ObjUtil,
	RecordUtil,
	Supplier,
} from "src/common/ObjUtil";
import { HotkeysUtil } from "src/common/HotkeysUtil";

export const enum HotkeysAssignmentFromEnum {
	Unset,
	Default,
	Custom,
}
export const enum HotkeysAssignmentToEnum {
	None,
	Specific,
}

enum AssignmentEnum {
	Assign,
	Restore,
	Ignore,
}
export type AssignmentType = keyof typeof AssignmentEnum;
type AssignmentInfoValue = {
	tooltip: string;
	icon: IconName;
};
const assignmentInfo: DeepReadonly<
	Record<AssignmentType, AssignmentInfoValue>
> = {
	Assign: { tooltip: "Assign right hotkeys", icon: "circle-arrow-left" },
	Restore: { tooltip: "Restore default", icon: "rotate-ccw" },
	Ignore: { tooltip: "Ignore", icon: "circle-slash" },
};
const assignmentKeys: ReadonlyArray<AssignmentType> =
	ObjUtil.keysOfEnum(AssignmentEnum);
const flagsOfAssignments = KeyFlags.factoryFromKeys(assignmentKeys);

type Params = DeepReadonly<{
	from: HotkeysAssignmentFromEnum;
	to: HotkeysAssignmentToEnum;
	fromHotkeys: Hotkey[] | undefined;
	toHotkeys: Hotkey[];
}>;
type Helper = Readonly<{
	checkSameHotkeys: Supplier<boolean>;
}>;
const assignmentPass: Readonly<
	Record<AssignmentType, (params: Params, helper: Helper) => boolean>
> = {
	Assign: ({ from }, { checkSameHotkeys }) => {
		return from !== HotkeysAssignmentFromEnum.Custom || !checkSameHotkeys();
	},
	Restore: ({ from }) => from === HotkeysAssignmentFromEnum.Custom,
	Ignore: () => true,
};
export abstract class CandidateAssignments {
	static candidateAssignmentInfo = (() => {
		const table: SafeDictionary<
			DeepReadonly<EntryObjForType<typeof assignmentInfo>[]>,
			number
		> = {};
		return (
			params: Params,
			helper: Helper = CandidateAssignments.helper(params)
		) => {
			const { from, to } = params;
			const flags = flagsOfAssignments(
				...assignmentKeys.filter((ass) =>
					assignmentPass[ass](params, helper)
				)
			);
			const cachedEntries = (table[flags.data] ??= (() => {
				const entryTuples = RecordUtil.subsetEntryTuples(
					assignmentInfo,
					flags.keysHaving(assignmentKeys)
				);
				const entryObjs = entryTuples.map(
					RecordUtil.objectifyEntryTupleForRecord
				);
				return entryObjs;
			})());

			const assInfo = new CircularList(cachedEntries);
			if (
				to === HotkeysAssignmentToEnum.None ||
				from === HotkeysAssignmentFromEnum.Custom ||
				helper.checkSameHotkeys()
			) {
				assInfo.prev();
			}

			return assInfo;
		};
	})();

	private static helper({
		from,
		to,
		fromHotkeys,
		toHotkeys,
	}: Params): Helper {
		return {
			checkSameHotkeys: (() => {
				let same: boolean;
				return () =>
					(same ??=
						from + to === 0 ||
						(fromHotkeys !== undefined &&
							fromHotkeys.length === toHotkeys.length &&
							fromHotkeys.every((hk, idx) =>
								HotkeysUtil.sameHotkey(hk, toHotkeys[idx])
							)));
			})(),
		};
	}
}
