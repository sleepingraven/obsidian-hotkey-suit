/*
 * @Author       sleepingraven
 * @Date         2025-03-06 11:41:20
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-03-08 18:59:24
 * @FilePath     \hotkey-suit\src\command\table\CommandMeta.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { App, Command, Hotkey } from "obsidian";
import { DeepReadonly, RequiredKeys } from "ts-essentials";
import { KeyFlags } from "src/common/DataStructure";
import { ObjUtil, UnionToTuple } from "src/common/ObjUtil";
import { Constants } from "src/common/Constants";
import { CommandsDummy } from "src/common/HotkeysUtil";

export abstract class CommandMetas {
	static requireSupported(
		cm: CommandMeta
	): cm is CommandMetaDelegateOrImplementor {
		return (() =>
			ObjUtil.requireProperties<CommandMetaDelegateOrImplementor>(
				cm,
				...requiredCmsKeys
			))();
	}

	static isDelegate(cms: CommandMetaDelegateOrImplementor) {
		return !cms._flags;
	}

	static newCommandInstance(
		app: App,
		cms: CommandMetaDelegateOrImplementor,
		hotkeys?: DeepReadonly<Hotkey[]>
	): Command | undefined {
		let command: Command;

		if (!CommandMetas.isDelegate(cms)) {
			command = CommandMetas.createNewCommandInstance(cms, hotkeys);
		} else {
			const commands = CommandsDummy.getInstance(app);
			const targetCommand = commands.findCommand(cms.id);
			if (!targetCommand) {
				console.error(
					`${Constants.BASE_NAME}: Command not found: ${cms.id}`
				);
				return;
			}

			const icms = CommandMetas.createNewCommandInstance(cms, hotkeys);
			command = new Proxy(targetCommand, {
				get(target, p, receiver) {
					if (p in icms) {
						return icms[p as keyof typeof icms];
					} else {
						return Reflect.get(target, p, receiver);
					}
				},
				set(_target, p, newValue, _receiver) {
					return Reflect.set(icms, p, newValue, icms);
				},
			});
		}

		return command;
	}

	static createNewCommandInstance(
		cms: CommandMetaDelegateOrImplementor,
		hotkeys?: DeepReadonly<Hotkey[]>
	): Command {
		const { _flags, _hks, ...command } = cms;
		if (hotkeys !== undefined) {
			command.hotkeys = CommandMetas.cloneHotkeys(hotkeys);
		}
		return command as Command;
	}

	static cloneHotkeys(hotkeys: DeepReadonly<Hotkey[]>): Hotkey[] {
		return hotkeys.map((hk) => ({
			modifiers: hk.modifiers.slice(),
			key: hk.key,
		}));
	}
}

const requiredCmsKeys: Readonly<
	UnionToTuple<RequiredKeys<CommandMetaDelegateOrImplementor>>
> = ["_hks", "id", "name"] as const;

type CustomMetadata = DeepReadonly<{
	_flags?: KeyFlags<ImplementationType>;
	_hks: Hotkey[];
}>;
type AllMetadata = DeepReadonly<Command & CustomMetadata>;

export type CommandMetaEmpty = DeepReadonly<
	Pick<AllMetadata, "name" | "_flags">
>;
export type CommandMetaDelegateOrImplementor = DeepReadonly<AllMetadata>;

export type CommandMeta = CommandMetaEmpty | CommandMetaDelegateOrImplementor;

export enum ImplementationEnum {
	Implemented,
	ByAnotherPlugin,
}
export type ImplementationType = keyof typeof ImplementationEnum;
export const flagsOfImplementations =
	KeyFlags.factoryFromEnum(ImplementationEnum);
