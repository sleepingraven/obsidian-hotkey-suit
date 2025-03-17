/*
 * @Author       sleepingraven
 * @Date         2025-01-31 18:43:38
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-01-31 18:51:18
 * @FilePath     \hotkey-suit\src\common\HotkeysUtil.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { App, Command, Hotkey } from "obsidian";
import { DeepReadonly } from "ts-essentials";
import { modifierFilter, keyFilter } from "src/common/HotkeyMap";

export abstract class CommandsDummy {
	static getInstance(app: App): CommandsDummy {
		// @ts-expect-error, not typed
		return app.commands as CommandsDummy;
	}

	abstract findCommand(id: string): Command | undefined;
}

export abstract class HotkeyManagerDummy {
	static getInstance(app: App): HotkeyManagerDummy {
		// @ts-expect-error, not typed
		return app.hotkeyManager as HotkeyManagerDummy;
	}

	abstract getDefaultHotkeys(id: string): Hotkey[] | undefined;
	abstract addDefaultHotkeys(id: string, hotkeys: Hotkey[]): void;

	abstract getHotkeys(id: string): Hotkey[] | undefined;
	abstract setHotkeys(id: string, hotkeys: Hotkey[]): void;
	abstract removeHotkeys(id: string): void;

	abstract save(): Promise<void>;
}

export abstract class HotkeysUtil {
	static sameHotkey(
		a: DeepReadonly<Hotkey>,
		b: DeepReadonly<Hotkey>
	): boolean {
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

	static hotkeysIndexOf(
		hotkeys: DeepReadonly<Hotkey[]>,
		hotkey: DeepReadonly<Hotkey>
	): number {
		return hotkeys.findIndex((a) => this.sameHotkey(a, hotkey));
	}

	static removeHotkey(
		hotkeys: DeepReadonly<Hotkey>[],
		hotkey: DeepReadonly<Hotkey>
	) {
		const idx = HotkeysUtil.hotkeysIndexOf(hotkeys, hotkey);
		if (idx >= 0) {
			hotkeys.splice(idx, 1);
		}
	}
}

export abstract class HotkeysRenderer {
	static renderHotkey(
		hotkey: DeepReadonly<Hotkey>,
		el: DocumentFragment,
		useSymbolicKeys = false
	) {
		hotkey.modifiers
			.map((m) => modifierFilter.get(useSymbolicKeys)[m] ?? m)
			.forEach((m) => {
				el.createEl("kbd", {
					text: m,
				});
				el.createSpan({
					text: " + ",
				});
			});
		el.createEl("kbd", {
			text: keyFilter.get(useSymbolicKeys)[hotkey.key] ?? hotkey.key,
		});
	}

	static textOfHotkey(hotkey: DeepReadonly<Hotkey>, useSymbolicKeys = false) {
		return hotkey.modifiers
			.map((m) => modifierFilter.get(useSymbolicKeys)[m] ?? m)
			.map((s) => s + " + ")
			.join("")
			.concat(keyFilter.get(useSymbolicKeys)[hotkey.key] ?? hotkey.key);
	}
}
