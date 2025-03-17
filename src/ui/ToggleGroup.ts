/*
 * @Author       sleepingraven
 * @Date         2025-03-05 15:24:24
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-03-08 21:42:31
 * @FilePath     \hotkey-suit\src\ui\ToggleGroup.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ToggleComponent, Component } from "obsidian";
import { BooleanRecord } from "src/common/DataStructure";

export class ToggleGroup {
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
