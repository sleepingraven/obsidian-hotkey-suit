/*
 * @Author       sleepingraven
 * @Date         2025-03-06 10:54:42
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-03-07 20:53:53
 * @FilePath     \hotkey-suit\src\ui\Badges.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { setTooltip, TooltipOptions } from "obsidian";
import { Constants } from "src/common/Constants";

export class Badges {
	readonly containerEl: HTMLElement;

	constructor(doc: DocumentFragment | HTMLElement) {
		this.containerEl = doc.createDiv({ cls: "setting-command-hotkeys" });
	}

	renderBadge(
		o: DomElementInfo | string,
		options?: {
			type?: BadgeTypeEnum;
			tooltipParams?: { tooltip: string; options?: TooltipOptions };
		}
	) {
		const cls = ["setting-hotkey", "mod-empty"];
		let el;
		if (typeof o === "string") {
			el = this.containerEl.createSpan({
				text: o,
				cls: cls,
			});
		} else {
			el = this.containerEl.createSpan(o);
			el.addClasses(cls);
		}

		if (options) {
			const { type, tooltipParams } = options;
			if (type) {
				el.addClass(type);
			}
			if (tooltipParams) {
				setTooltip(el, tooltipParams.tooltip, tooltipParams.options);
			}
		}
	}
}

export const enum BadgeTypeEnum {
	Default,
	Backdrop = Constants.BADGE_BACKDROP_CLS,
}
