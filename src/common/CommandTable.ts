/*
 * @Author       sleepingraven
 * @Date         2025-01-25 17:22:25
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-01-31 18:43:48
 * @FilePath     \hotkey-suit\src\common\CommandTable.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { App, Command, EditorSelection, Hotkey, Notice } from "obsidian";
import { Constants, ENV_VAR } from "src/common/Constants";
import { CommandsDummy } from "src/common/CommandsUtil";

/* CommandMeta */

/**
 * @see Command
 */
export type CommandMeta = CommandMetaEmpty | CommandMetaDelegateOrImplementor;
export class CommandMetaEmpty {
	name: string;
}
export class CommandMetaDelegateOrImplementor {
	name: string;
	id: string;
	_hks: Readonly<Hotkey[]>;

	static newCommandInstance(
		cmd: CommandMetaDelegateOrImplementor,
		app: App,
		hotkeysSupplier: () => Hotkey[] | undefined = () => undefined
	): Command | undefined {
		let command;

		const asCommand = cmd as Command;
		if (asCommand.editorCheckCallback) {
			command = { ...asCommand };
		} else {
			const commands = CommandsDummy.getCommandsInstance(app);
			const targetCommand = commands.findCommand(cmd.id);
			if (!targetCommand) {
				console.error(
					`${Constants.BASE_NAME}: Command not found: ${cmd.id}`
				);
				return;
			}

			cmd = { ...cmd } as CommandMetaDelegateOrImplementor;
			command = new Proxy(targetCommand, {
				get(target, p, receiver) {
					if (p in cmd) {
						return cmd[p as keyof CommandMetaDelegateOrImplementor];
					} else {
						return Reflect.get(target, p, receiver);
					}
				},
				set(_target, p, newValue, _receiver) {
					cmd[p as keyof CommandMetaDelegateOrImplementor] = newValue;
					if (!(p in cmd)) {
						console.error(`${Constants.BASE_NAME}: p isn't in cmd`);
						console.log(targetCommand);
						console.log(cmd);
						console.log(p);
					}
					return true;
				},
			});
		}

		command.hotkeys = hotkeysSupplier();
		return command;
	}
}

/* RootCommandNode */

export type CommandNode = {
	title?: string;
	children?: CommandNode[];
	commands?: CommandMeta[];
};

export function instantiateRootCommandNode(): CommandNode {
	const root: CommandNode = {};
	root.children = [
		{ title: "Edit", commands: editCommands() },
		{ title: "Paragraph", commands: paragraphCommands() },
		{ title: "Table", commands: tableCommands() },
		{ title: "Format", commands: formatCommands() },
		{ title: "View", commands: viewCommands() },
	];

	return root;
}

function editCommands(): CommandMeta[] {
	return [
		{ name: `Select paragraph/block` },
		{ name: `Delete paragraph/block` },
		{ name: `Select line/sentence / Select row (in table)` },
		{ name: `Delete line/sentence` },
		{ name: `Select style scope / Select cell (in table)` },
		{ name: `Delete style scope` },
		{ name: `Select word` },
		{ name: `Delete word` },
		{ name: `Jump to selection` },
	];
}

function paragraphCommands(): CommandMeta[] {
	return [
		...Array.from(
			{ length: Constants.MAX_HEADING_LEVEL as number },
			(_, i) => i + 1
		).map((i) => {
			return {
				name: `Heading ${i}`,
				id: `editor:set-heading-${i}`,
				_hks: [
					{
						modifiers: ["Mod"],
						key: `${i}`,
					},
				] as Readonly<Hotkey[]>,
			} as CommandMetaDelegateOrImplementor;
		}),
		{
			name: `Paragraph`,
			id: `editor:set-heading-0`,
			_hks: [
				{
					modifiers: ["Mod"],
					key: `0`,
				},
			],
		},
		{ name: `Increase heading level` },
		{ name: `Decrease heading level` },
		{
			name: `Math block`,
			id: `editor:insert-mathblock`,
			_hks: [
				{
					modifiers: ["Mod", "Shift"],
					key: `M`,
				},
			],
		},
		{
			name: `Code fences`,
			id: `editor:insert-codeblock`,
			_hks: [
				{
					modifiers: ["Mod", "Shift"],
					key: `K`,
				},
			],
		},
		{
			name: `Quote`,
			id: `editor:toggle-blockquote`,
			_hks: [
				{
					modifiers: ["Mod", "Shift"],
					key: `Q`,
				},
			],
		},
		{
			name: `Ordered list`,
			id: `editor:toggle-numbered-list`,
			_hks: [
				{
					modifiers: ["Mod", "Shift"],
					key: `[`,
				},
			],
		},
		{
			name: `Unordered list`,
			id: `editor:toggle-bullet-list`,
			_hks: [
				{
					modifiers: ["Mod", "Shift"],
					key: `]`,
				},
			],
		},
		{
			name: `Cycle unordered/Task list`,
			id: `editor:cycle-list-checklist`,
			_hks: [
				{
					modifiers: ["Mod", "Shift"],
					key: `X`,
				},
			],
		},
		{ name: `Indent` },
		{ name: `Outdent` },
	] as CommandMeta[];
}

function tableCommands(): CommandMeta[] {
	return [
		{
			name: `Table`,
			id: `editor:insert-table`,
			_hks: [
				{
					modifiers: ["Mod"],
					key: `T`,
				},
			],
		},
		{
			name: `Add row below`,
			id: `editor:table-row-after`,
			_hks: [
				{
					modifiers: ["Mod"],
					key: `Enter`,
				},
			],
		},
		{
			name: `Move row up`,
			id: `editor:table-row-up`,
			_hks: [
				{
					modifiers: ["Alt"],
					key: `ArrowUp`,
				},
			],
		},
		{
			name: `Move row down`,
			id: `editor:table-row-down`,
			_hks: [
				{
					modifiers: ["Alt"],
					key: `ArrowDown`,
				},
			],
		},
		{
			name: `Move column left`,
			id: `editor:table-col-left`,
			_hks: [
				{
					modifiers: ["Alt"],
					key: `ArrowLeft`,
				},
			],
		},
		{
			name: `Move column right`,
			id: `editor:table-col-right`,
			_hks: [
				{
					modifiers: ["Alt"],
					key: `ArrowRight`,
				},
			],
		},
		{
			name: `Delete row`,
			id: `editor:table-row-delete`,
			_hks: [
				{
					modifiers: ["Mod", "Shift"],
					key: `Backspace`,
				},
				{
					modifiers: ["Mod", "Shift"],
					key: `Delete`,
				},
			],
		},
	];
}

function formatCommands(): CommandMeta[] {
	return [
		{
			name: `Underline`,
			id: `editor:toggle-underline`,
			_hks: [
				{
					modifiers: ["Mod"],
					key: `U`,
				},
			],
			editorCheckCallback(checking, editor) {
				const applyToLine = (selection: EditorSelection) => {
					const tagStart = "<u>";
					const tagEnd = "</u>";

					const { anchor, head } = selection;
					const [positionStart, positionEnd] =
						anchor.ch <= head.ch ? [anchor, head] : [head, anchor];

					const lineNum = positionStart.line;
					const line = editor.getLine(lineNum);
					const startMatch = /(.*)<u>/.exec(
						line.substring(0, positionStart.ch + tagStart.length)
					);
					const endMatch = /<\/u>/.exec(
						line.substring(positionEnd.ch - tagEnd.length)
					);

					const startFromIdx = startMatch ? startMatch[1].length : -1;
					const endToIdx = endMatch
						? positionEnd.ch + endMatch.index
						: -1;
					ENV_VAR.logDevMessages(() => [
						`Underline: startMatch = ${startMatch}`,
						`Underline: endMatch = ${endMatch}`,
						`Underline: endToIdx = ${endToIdx}`,
						`Underline: startFromIdx = ${startFromIdx}`,
					]);
					if (startMatch && endMatch) {
						const untaggedSubstring = line.substring(
							startFromIdx + tagStart.length,
							endToIdx - tagEnd.length
						);
						editor.replaceRange(
							untaggedSubstring,
							{
								line: lineNum,
								ch: startFromIdx,
							},
							{
								line: lineNum,
								ch: endToIdx,
							}
						);
					} else {
						if (positionStart.ch === positionEnd.ch) {
							editor.replaceRange(
								tagStart + line + tagEnd,
								{ line: lineNum, ch: 0 },
								{ line: lineNum, ch: line.length }
							);
						} else {
							editor.replaceRange(
								tagStart +
									line.substring(
										positionStart.ch,
										positionEnd.ch
									) +
									tagEnd,
								positionStart,
								positionEnd
							);
						}
					}
				};

				const selections = editor.listSelections();
				if (selections.some((s) => s.anchor.line !== s.head.line)) {
					if (!checking) {
						new Notice(
							`${Constants.BASE_DISPLAY_TEXT_CAP}: Unable to underline multiple lines.`
						);
					}
					return false;
				}

				if (!checking) {
					selections.forEach(applyToLine);
				}
				return true;
			},
		} as Command,
		{
			name: `Code`,
			id: `editor:toggle-code`,
			_hks: [
				{
					modifiers: ["Mod", "Shift"],
					key: `\``,
				},
			],
		},
		{
			name: `Strike`,
			id: `editor:toggle-strikethrough`,
			_hks: [
				{
					modifiers: ["Alt", "Shift"],
					key: `5`,
				},
			],
		},
		{ name: `Image` },
		{ name: `Clear format` },
	] as CommandMeta[];
}

function viewCommands(): CommandMeta[] {
	return [
		{ name: `Toggle sidebar` },
		{
			name: `Outline`,
			id: `outline:open`,
			_hks: [
				{
					modifiers: ["Mod", "Shift"],
					key: `1`,
				},
			],
		},
		{
			name: `File tree`,
			id: `file-explorer:open`,
			_hks: [
				{
					modifiers: ["Mod", "Shift"],
					key: `3`,
				},
			],
		},
		{
			name: `Source code mode`,
			id: `editor:toggle-source`,
			_hks: [
				{
					modifiers: ["Mod"],
					key: `/`,
				},
			],
		},
	] as CommandMeta[];
}
