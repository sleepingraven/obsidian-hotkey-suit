/*
 * @Author       sleepingraven
 * @Date         2025-03-06 10:54:42
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-03-07 20:53:53
 * @FilePath     \hotkey-suit\src\ui\Badges.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { setTooltip, TooltipOptions } from "obsidian";
import { ReadonlyArrayOrSingle } from "ts-essentials";
import { Constants } from "src/common/Constants";
import { castReadonlyArray } from "src/common/ObjUtil";

export class Badges {
	readonly containerEl: HTMLElement;

	constructor(doc: DocumentFragment | HTMLElement) {
		this.containerEl = doc.createDiv({ cls: "setting-command-hotkeys" });
	}

	renderBadge(
		o: DomElementInfo | string,
		options?: {
			type?: ReadonlyArrayOrSingle<BadgeTypeEnum>;
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
			if (type !== undefined) {
				el.addClass(...typeClasses(castReadonlyArray(type)));
			}
			if (tooltipParams) {
				setTooltip(el, tooltipParams.tooltip, tooltipParams.options);
			}
		}
	}
}

export const enum BadgeTypeEnum {
	Default,
	Backdrop,
}
const typeClasses = (() => {
	type ExcludeDefault = Exclude<BadgeTypeEnum, BadgeTypeEnum.Default>;
	const typeClass: Readonly<Record<ExcludeDefault, string>> = {
		[BadgeTypeEnum.Backdrop]: Constants.BADGE_BACKDROP_CLS,
	};
	return (types: ReadonlyArray<BadgeTypeEnum>) =>
		types
			.filter(
				(type): type is ExcludeDefault => type !== BadgeTypeEnum.Default
			)
			.map((type) => typeClass[type]);
})();
