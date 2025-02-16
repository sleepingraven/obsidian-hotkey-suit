/*
 * @Author       sleepingraven
 * @Date         2025-01-31 18:43:38
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-01-31 18:51:18
 * @FilePath     \hotkey-suit\src\common\CommandsUtil.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { App, Command, Hotkey } from "obsidian";
import { modifierFilter, keyFilter } from "src/common/HotkeyMap";

export abstract class CommandsDummy {
	static getCommandsInstance(app: App): CommandsDummy {
		// @ts-expect-error, not typed
		return app.commands as CommandsDummy;
	}

	abstract findCommand(id: string): Command | undefined;
}

export class HotkeysUtil {
	static readonly ABSENT_INDEX = -1;

	static sameHotkey(a: Hotkey, b: Hotkey): boolean {
		if (a.modifiers.length !== b.modifiers.length) {
			return false;
		}
		if (
			a.modifiers.some((m, idx) => {
				m !== b.modifiers[idx];
			})
		) {
			return false;
		}
		if (a.key !== b.key) {
			return false;
		}
		return true;
	}

	static hotkeysIndexOf(hotkeys: Hotkey[], hotkey: Hotkey): number {
		return hotkeys.findIndex((a) => this.sameHotkey(a, hotkey));
	}

	static renderHotkey(k: Hotkey, el: DocumentFragment) {
		k.modifiers
			.map((m) => modifierFilter[m] ?? m)
			.forEach((m) => {
				el.createEl("kbd", {
					text: m,
				});
				el.createSpan({
					text: " + ",
				});
			});
		el.createEl("kbd", {
			text: keyFilter[k.key] ?? k.key,
		});
	}
}
