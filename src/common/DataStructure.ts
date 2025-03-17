/*
 * @Author       sleepingraven
 * @Date         2025-03-06 16:54:13
 * @LastEditors  sleepingraven
 * @LastEditTime 2025-03-08 21:44:02
 * @FilePath     \hotkey-suit\src\common\DataStructure.ts
 * @Description  这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { KeyofBase, SafeDictionary } from "ts-essentials";
import {
	AnyEnum,
	BooleanFunction,
	FunctionalFunction,
	ObjUtil,
	RecordUtil,
	ToNumberFunction,
} from "src/common/ObjUtil";

export abstract class Collections {
	static computeIfAbsent<K, V>(
		map: Map<K, V>,
		key: K,
		func: FunctionalFunction<K, V>
	) {
		if (map.has(key)) {
			return map.get(key) as V;
		}
		const value = func(key);
		map.set(key, value);
		return value;
	}
}

export class BitSet {
	private _data: number;

	constructor(...masks: readonly number[]) {
		this._data = BitSet.bitsOf(masks);
	}

	get data() {
		return this._data;
	}

	set(mask: number) {
		this._data |= mask;
	}

	has(mask: number) {
		return this._data & mask;
	}

	static bitsOf(masks: readonly number[]) {
		return masks.reduce((acc, mask) => acc | mask, 0);
	}
}

type KeyMaskTable<K extends KeyofBase> = Readonly<SafeDictionary<number, K>>;
export class KeyFlags<K extends KeyofBase> extends BitSet {
	private readonly maskOfKey: ToNumberFunction<K>;

	constructor(maskOfKey: ToNumberFunction<K>, ...subsetKeys: readonly K[]) {
		const masks = subsetKeys.map(maskOfKey);
		super(...masks);
		this.maskOfKey = maskOfKey;
	}

	static factoryFromEnum<T extends AnyEnum>(enumObj: T) {
		const keys = ObjUtil.keysOfEnum(enumObj);
		return KeyFlags.factoryFromKeys(keys);
	}
	static factoryFromKeys<K extends KeyofBase>(keys: readonly K[]) {
		const table = KeyFlags.buildKeyMaskTable(keys);
		return KeyFlags.factoryFromKeyMaskTable(table);
	}
	static factoryFromKeyMaskTable<K extends KeyofBase>(
		table: KeyMaskTable<K>
	) {
		const maskOfKey = (key: K) => table[key] ?? 0;
		return (...subsetKeys: readonly K[]) =>
			new KeyFlags<K>(maskOfKey, ...subsetKeys);
	}

	setKey(key: K) {
		const mask = this.maskOfKey(key);
		this.set(mask);
	}

	hasKey(key: K) {
		const mask = this.maskOfKey(key);
		return this.has(mask);
	}

	keysHaving(subsetKeys: readonly K[]) {
		return subsetKeys.filter(this.hasKey.bind(this));
	}

	static buildKeyMaskTable<K extends KeyofBase>(keys: readonly K[]) {
		return RecordUtil.newRecord(keys, (_key, idx) => 1 << idx);
	}
}

export class BooleanRecord<T> {
	private readonly record: ReadonlyArray<T>;

	constructor(booleanFunction: BooleanFunction<T>) {
		this.record = [
			booleanFunction(BooleanRecord.intToBoolean(0)),
			booleanFunction(BooleanRecord.intToBoolean(1)),
		];
	}

	get(key: boolean) {
		return this.record[BooleanRecord.booleanToInt(key)];
	}

	static from<T>(records: readonly T[]) {
		return new BooleanRecord(
			(key) => records[BooleanRecord.booleanToInt(key)]
		);
	}

	private static booleanToInt(key: boolean) {
		return key ? 1 : 0;
	}
	private static intToBoolean(i: number) {
		return !!i;
	}
}

/*
 * Exception: length === 0
 */
export class CircularList<T> {
	private readonly origin: ReadonlyArray<T>;
	private _index: number;

	constructor(arr: readonly T[]) {
		this.origin = arr;
		this._index = 0;
	}

	get index() {
		return this._index;
	}
	set index(index: number) {
		this._index = this.validateIndex(index);
	}
	get length() {
		return this.origin.length;
	}
	get current() {
		return this.origin[this._index];
	}

	next() {
		this._index = (this._index + 1) % this.length;
		return this.current;
	}
	prev() {
		this._index = (this._index - 1 + this.length) % this.length;
		return this.current;
	}
	shift(steps: number) {
		this.index += steps;
		return this.current;
	}
	relative(steps: number) {
		const targetIndex = this.validateIndex(this._index + steps);
		return this.origin[targetIndex];
	}

	validateIndex(index: number) {
		const { length } = this;
		return ((index % length) + length) % length;
	}
}
