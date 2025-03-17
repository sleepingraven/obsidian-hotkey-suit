/*
 * @Author       sleepingraven
 * @Date         2025-01-25 14:57:47
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-01-25 14:58:00
 * @FilePath     \hotkey-suit\src\common\Constants.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Platform } from "obsidian";
import { ReadonlyArrayOrSingle } from "ts-essentials";
import { castReadonlyArray, Supplier } from "src/common/ObjUtil";

const BASE_NAME = "hotkey-suit";
export const Constants = {
	BASE_NAME: BASE_NAME,
	BASE_DISPLAY_TEXT_CAP: "Hotkey suit",

	MAX_HEADING_LEVEL: 6,

	STRIKETHROUGH_NOT_SUPPORTED: false,

	SETTING_CONTAINER_CLS: `${BASE_NAME}-setting-container`,
	BADGE_BACKDROP_CLS: `${BASE_NAME}-badge-backdrop`,
	DISPLAY_NONE_CLS: `${BASE_NAME}-display-none`,
} as const;

export const ENV_VAR = {
	DEV_MODE: false,

	logDevMessage(msgSupplier: Supplier<ReadonlyArrayOrSingle<string>>) {
		if ((this as typeof ENV_VAR).DEV_MODE) {
			castReadonlyArray(msgSupplier()).forEach((msg) =>
				console.log(`${Constants.BASE_NAME}: ${msg}`)
			);
		}
	},

	/**
	 * @deprecated use {@link Platform.isMacOS}
	 */
	isMacOS:
		navigator.platform.indexOf("Mac") === 0 ||
		navigator.platform === "iPhone",
} as const;
