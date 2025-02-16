/*
 * @Author       sleepingraven
 * @Date         2025-01-25 14:57:47
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-01-25 14:58:00
 * @FilePath     \hotkey-suit\common\Constants.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Platform } from "obsidian";

export enum Constants {
	BASE_NAME = "hotkey-suit",

	MAX_HEADING_LEVEL = 6,

	DISPLAY_NOT_SUPPORTED = 0,
	STRIKETHROUGH_NOT_SUPPORTED = 0,
}

export const ENV_VAR = {
	/**
	 * @deprecated use {@link Platform.isMacOS}
	 */
	isMacOS:
		navigator.platform.indexOf("Mac") === 0 ||
		navigator.platform === "iPhone",
} as const;
