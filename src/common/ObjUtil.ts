import {
	AnyArray,
	AnyFunction,
	ArrayOrSingle,
	createFactoryWithConstraint,
	DeepReadonly,
	Dictionary,
	Head,
	KeyofBase,
	Merge,
	MergeN,
	NonEmptyObject,
	PathValue,
	PredicateFunction,
	PredicateType,
	ReadonlyArrayOrSingle,
	Tail,
	Tuple,
} from "ts-essentials";

const asTuple = <Type extends Tuple>(args: Type): Type => args;
const identity = <Type>(value: Type) => value;

const createNonEmptyObject = <TObject extends Record<string, unknown>>(
	obj: NonEmptyObject<TObject>
) => obj;

const castArray = <Type>(value: ArrayOrSingle<Type>): Type[] =>
	Array.isArray(value) ? value : [value];
export const castReadonlyArray = <Type>(
	value: ReadonlyArrayOrSingle<Type>
): readonly Type[] => (isReadonlyArray(value) ? value : [value]);

type FirstParameter<Type extends AnyFunction> = Head<Parameters<Type>>;
const first = <Type extends AnyArray>(tuple: readonly [...Type]) =>
	tuple[0] as Type[0];
const tail = <Type extends AnyArray>(tuple: readonly [...Type]) =>
	tuple.slice(1) as Tail<Type>;

const isReadonlyArray: (value: unknown) => value is readonly any[] =
	Array.isArray;

const createPredicate = createFactoryWithConstraint<PredicateFunction>();

const isBoolean = createPredicate(
	(value: unknown): value is boolean => typeof value === "boolean"
);
const isEachElementOf = <Type extends PredicateFunction>(
	thing: unknown,
	elementPredicate: Type
): thing is Array<PredicateType<Type>> => {
	return Array.isArray(thing) && thing.every(elementPredicate);
};

const isTruthy = <Type>(value: Type): value is NonNullable<Type> =>
	Boolean(value);
type Truthy<Type> = PredicateType<typeof isTruthy<Type>>;

export type AnyEnum = Dictionary<unknown>;

export abstract class ObjUtil {
	static requireProperties<T>(obj: unknown, ...props: (keyof T)[]): obj is T {
		return props.every(
			(prop) => typeof obj === "object" && obj !== null && prop in obj
		);
	}

	static keysOfEnum<T extends AnyEnum>(
		enumObj: T
	): Extract<keyof T, string>[] {
		return Object.keys(enumObj).filter(
			(key): key is Extract<keyof T, string> => isNaN(Number(key))
		);
	}

	static pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
		return keys.reduce((acc, key) => {
			acc[key] = obj[key];
			return acc;
		}, {} as Pick<T, K>);
	}

	static merge<T, U>(obj1: T, obj2: U) {
		return { ...obj1, ...obj2 } as unknown as Merge<T, U>;
	}
	static mergeAll = <Tuple extends Record<string, unknown>[]>(
		...args: [...Tuple]
	): MergeN<Tuple> => {
		let merged = {} as MergeN<Tuple>;
		for (const obj of args) {
			merged = { ...merged, ...obj };
		}
		return merged;
	};

	static get<Type, StringPath extends string>(
		obj: Type,
		path: `${StringPath}`
	): PathValue<Type, StringPath>;
	static get<Type>(obj: Type, path: string) {
		const keys = (path as string).split(".") as (keyof Type)[];
		return keys.reduce((acc, key) => acc?.[key] as unknown as Type, obj);
	}

	static deepFreeze<Type extends object>(obj: Type): DeepReadonly<Type> {
		// Retrieve the property names defined on object
		const propNames = Reflect.ownKeys(obj) as (keyof Type)[];
		// Freeze properties before freezing self
		for (const name of propNames) {
			const value = obj[name];
			if (
				(value && typeof value === "object") ||
				typeof value === "function"
			) {
				ObjUtil.deepFreeze(value as unknown as object);
			}
		}
		return Object.freeze(obj) as DeepReadonly<Type>;
	}
}

type AnyRecord<T> = { [K in keyof T]: T[K] };

type EntryTupleForType<T> = { [K in keyof T]: [K, T[K]] }[keyof T];
type EntryObj<K, V> = { key: K; value: V };
export type EntryObjForType<T> = { [K in keyof T]: EntryObj<K, T[K]> }[keyof T];

export abstract class RecordUtil {
	static newRecord<K extends KeyofBase, V>(
		keys: readonly K[],
		func: (key: K, index: number, array: readonly K[]) => V
	) {
		return keys.reduce((acc, key, idx, arr) => {
			acc[key] = func(key, idx, arr);
			return acc;
		}, {} as Record<K, V>);
	}

	static subsetEntryTuples<T, K extends keyof T>(obj: T, keys: K[]) {
		const picked = ObjUtil.pick(obj, ...keys);
		return Object.entries(picked) as EntryTupleForType<T>[];
	}
	static objectifyEntryTupleForRecord<T extends AnyRecord<T>>(
		entryTuple: EntryTupleForType<T>
	) {
		const [key, value] = entryTuple;
		return { key, value } as EntryObjForType<T>;
	}
}

export type Consumer<T> = FunctionalFunction<T, void>;
export type Supplier<T> = () => T;
export type FunctionalFunction<U, V> = (arg: U) => V;
export type ToNumberFunction<T> = FunctionalFunction<T, number>;
export type BooleanFunction<T> = FunctionalFunction<boolean, T>;

type InternalUnionToIntersection<U> = (
	U extends any ? (a: (k: U) => void) => void : never
) extends (a: infer I) => void
	? I
	: never;
type UnionLast<U> = InternalUnionToIntersection<U> extends (a: infer I) => void
	? I
	: never;
export type UnionToTuple<U> = [U] extends [never]
	? []
	: [...UnionToTuple<Exclude<U, UnionLast<U>>>, UnionLast<U>];
