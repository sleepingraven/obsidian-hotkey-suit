/*
 * @Author       sleepingraven
 * @Date         2025-01-25 23:29:38
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-02-01 15:36:25
 * @FilePath     \hotkey-suit\src\common\HotkeyMap.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Modifier, Platform } from "obsidian";
import { DeepReadonly, SafeDictionary } from "ts-essentials";
import { BooleanRecord } from "src/common/DataStructure";

const modifierFilterRecord: DeepReadonly<SafeDictionary<string, Modifier>[]> = [
	{
		Mod: Platform.isMacOS ? "Cmd" : "Ctrl",
		Ctrl: "Ctrl",
		Meta: Platform.isMacOS ? "Cmd" : "Win",
		Shift: "Shift",
	},
	{
		Mod: Platform.isMacOS ? "⌘ Cmd" : "Ctrl",
		Ctrl: "Ctrl",
		Meta: Platform.isMacOS ? "⌘ Cmd" : "⊞ Win",
		Shift: "⇧ Shift",
	},
];
export const modifierFilter = BooleanRecord.from(modifierFilterRecord);

const keyFilterRecord: DeepReadonly<SafeDictionary<string>[]> = [
	{
		Tab: "Tab",
		"Caps Lock": "Caps Lock",
		Enter: "Enter",
		Backspace: "Backspace",
		ArrowUp: "↑",
		ArrowDown: "↓",
		ArrowLeft: "←",
		ArrowRight: "→",
	},
	{
		Tab: "Tab ↹",
		"Caps Lock": "⇪ Caps Lock",
		Enter: "↵ Enter",
		Backspace: "← Backspace",
		ArrowUp: "↑",
		ArrowDown: "↓",
		ArrowLeft: "←",
		ArrowRight: "→",
	},
];
export const keyFilter = BooleanRecord.from(keyFilterRecord);
