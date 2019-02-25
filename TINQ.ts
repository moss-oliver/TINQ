//TINQ
//By: Oliver Moss
//License: MIT

//Changelog:
//0.1.1 
//Added Select fuction
//Added ToArray function
//Added Join function

export module Tinq {
    
    class EnumeratorEnd {
        constructor() {

        }
    }
    let enumeratorEndInstance = new EnumeratorEnd();

    interface IEqualityComparer<T> {
        (value1: T, value2: T): boolean;
    }

    function DefaultEqualityComparer<T>(value1: T, value2: T): boolean {
        return value1 === value2;
    }
    
    enum CompareResult {
        Smaller,
        Larger,
        Equal
    }

    interface IComparer<T> {
        (value1: T, value2: T): CompareResult;
    }

    function DefaultComparer<T>(value1: T, value2: T): CompareResult {
        if (value1 > value2) {
            return CompareResult.Larger;
        } else if (value1 < value2) {
            return CompareResult.Smaller;
        } else {
            return CompareResult.Equal;
        }
    }

    interface IEnumerator<T> {
        Next(): T | EnumeratorEnd;
        Peek(): T | EnumeratorEnd;
    }

    class ArrayEnumerator<T> implements IEnumerator<T> {
        m_index: number;
        m_array: Array<T>;

        constructor(array: Array<T>) {
            this.m_array = array;
            this.m_index = 0;
        }

        Next(): T | EnumeratorEnd {
            if (this.m_index < this.m_array.length) {
                let retVal = this.m_array[this.m_index];
                this.m_index += 1;
                return retVal;
            }
            return enumeratorEndInstance;
        }

        Peek(): T | EnumeratorEnd {
            if (this.m_index < this.m_array.length) {
                return this.m_array[this.m_index];
            }
            return enumeratorEndInstance;
        }

        Reset(): void {
            this.m_index = 0;
        }
    }

    class RangeEnumerator implements IEnumerator<number> {
        m_start: number;
        m_end: number;
        m_curr: number;

        constructor(start : number, end : number) {
            this.m_start = start;
            this.m_end = end;
            this.m_curr = start;
        }

        Next(): number | EnumeratorEnd {
            if (this.m_curr <= this.m_end) {
                let retVal = this.m_curr;
                this.m_curr += 1;
                return retVal;
            }
            return enumeratorEndInstance;
        }
        Peek(): number | EnumeratorEnd {
            if (this.m_curr <= this.m_end) {
                return this.m_curr;
            }
            return enumeratorEndInstance;
        }
        Reset(): void {
            this.m_curr = this.m_start;
        }
    }

    export function FromArray<T>(array: Array<T>): IEnumerable<T> {
        return new SimpleEnumerable(() => new ArrayEnumerator(array));
    }

    export function Range(start: number, end: number): IEnumerable<number> {
        return new SimpleEnumerable(() => new RangeEnumerator(start, end));
    }

    export interface IEnumerable<T> {
        GetEnumerator() :IEnumerator<T>;

        ForEach(callback: (value: T) => void): void;
        ToArray(): Array<T>;

        Any(): boolean;
        Contains(value: T, comparer?: IEqualityComparer<T>): boolean;
        First(): T | EnumeratorEnd;
        FirstOrNull(): T | null;
        Last(): T | EnumeratorEnd;
        LastOrNull(): T | null;

        Count(): number;

        Select<TOut>(selector:(value: T)=> TOut): IEnumerable<TOut>;
        OrderBy<TKey>(keySelector:(value: T) => TKey, comparer?: IComparer<TKey>): IEnumerable<T>;
        Where(clause: (value: T) => boolean): IEnumerable<T>;
        Append(value: T): IEnumerable<T>;
        Concat(values: IEnumerable<T>): IEnumerable<T>;
        Join<U, K, J>(other: IEnumerable<U>, key1: (v: T)=>K, key2: (v:U)=>K, joiner: (v1: T, v2: U)=> J): IEnumerable<J>;
    }

    abstract class Enumerable<T> implements IEnumerable<T> {
        abstract GetEnumerator() :IEnumerator<T>;
        
        ForEach(callback: (value: T) => void): void {
            let en = this.GetEnumerator();
            let it = en.Next();

            while (!(it instanceof EnumeratorEnd)) {
                callback(it);

                it = en.Next();
            }
        }
        ToArray(): Array<T> {
            var array = new Array<T>();
            this.ForEach((x) => {
                array.push(x);
            });
            return array;
        }
        
        Any(): boolean {
            let en = this.GetEnumerator();
            return !(en.Peek() instanceof EnumeratorEnd);
        }
        Contains(value: T, comparer?: IEqualityComparer<T>): boolean {
            let currentComparer:  (value1: T, value2: T) => boolean 
            if (comparer === undefined) {
                currentComparer = DefaultEqualityComparer;
            } else {
                currentComparer = comparer;
            }
            
            let en = this.GetEnumerator();

            let it = en.Next();

            while (!(it instanceof EnumeratorEnd)) {
                if (currentComparer(value, it)) {
                    return true;
                }
                it = en.Next();
            }
            return false;
        }
        First(): T | EnumeratorEnd {
            let en = this.GetEnumerator();
            return en.Peek();
        }
        FirstOrNull(): T | null {
            let res = this.First();
            return (res instanceof EnumeratorEnd) ? null : res;
        }
        Last(): T | EnumeratorEnd {
            let en = this.GetEnumerator();
            let it = en.Next();
            let res = it;

            while (!(it instanceof EnumeratorEnd)) {
                res = it;
                it = en.Next();
            }
            return res;
        }
        LastOrNull(): T | null {
            let res = this.Last();
            return (res instanceof EnumeratorEnd) ? null : res;
        }
        
        Count(): number {
            let en = this.GetEnumerator();
            let it = en.Next();

            let count = 0;
            while (!(it instanceof EnumeratorEnd)) {
                it = en.Next();
                count +=1;
            }
            return count;
        }
        
        Select<TOut>(selector:(value: T)=> TOut): IEnumerable<TOut> {
            return new SelectEnumerable(this, selector);
        }
        Where(clause: (value: T) => boolean): IEnumerable<T> {
            return new WhereEnumerable(this, clause);
        }
        OrderBy<TKey>(keySelector:(value: T) => TKey, comparer: IComparer<TKey>): IEnumerable<T> {
            let currentComparer:  IComparer<TKey>
            if (comparer === undefined) {
                currentComparer = DefaultComparer;
            } else {
                currentComparer = comparer;
            }

            return new OrderByEnumerable(this, keySelector, currentComparer);
        }
        Append(value: T): IEnumerable<T> {
            return new AppendEnumerable(this, Tinq.FromArray( new Array<T>( value ) ));
        }
        Concat(values: IEnumerable<T>): IEnumerable<T> {
            return new AppendEnumerable(this, values);
        }
        
        Join<U, K, J>(other: IEnumerable<U>, key1: (v: T)=>K, key2: (v:U)=>K, joiner: (v1: T, v2: U)=> J): IEnumerable<J> {
            return new JoinEnumerable(this, other, key1, key2, joiner);
        }
    }

    class SimpleEnumerable<T> extends Enumerable<T> {
        m_enumerableGenerator: () => IEnumerator<T>;
        constructor(enumerableGenerator: () => IEnumerator<T>) {
            super();
            this.m_enumerableGenerator = enumerableGenerator;
        }

        GetEnumerator(): IEnumerator<T> {
            return this.m_enumerableGenerator();
        }

    }

    //SELECT
    
    class SelectEnumerator<T, TOut> implements IEnumerator<TOut> {
        m_selector:(value: T)=> TOut;
        m_enumerator: IEnumerator<T>;

        constructor(enumerable: IEnumerable<T>, selector:(value: T)=> TOut) {
            this.m_selector = selector;
            this.m_enumerator = enumerable.GetEnumerator();
        }

        Next(): TOut | EnumeratorEnd {
            let testItem = this.m_enumerator.Next();
            if (!(testItem instanceof EnumeratorEnd))
            {
                return this.m_selector(testItem);
            }
            return testItem;
        }
        Peek(): TOut | EnumeratorEnd {
            let testItem = this.m_enumerator.Peek();
            if (!(testItem instanceof EnumeratorEnd))
            {
                return this.m_selector(testItem);
            }
            return testItem;
        }
    }

    class SelectEnumerable<T, TOut> extends Enumerable<TOut> implements IEnumerable<TOut> {
        m_selector: (value: T) => TOut;
        m_enumerable: IEnumerable<T>;

        constructor(enumerable: IEnumerable<T>, selector: (value: T) => TOut) {
            super();
            this.m_enumerable = enumerable;
            this.m_selector = selector;
        }

        GetEnumerator() : IEnumerator<TOut> {
            return new SelectEnumerator(this.m_enumerable, this.m_selector)
        }
    }

    //WHERE

    class WhereEnumerator<T> implements IEnumerator<T> {
        m_clause: (value: T) => boolean;
        m_enumerable: IEnumerable<T>
        m_enumerator: IEnumerator<T>

        constructor(enumerable: IEnumerable<T>, clause: (value: T) => boolean) {
            this.m_enumerable = enumerable;
            this.m_clause = clause;
            this.m_enumerator = enumerable.GetEnumerator();
        }

        Next(): T | EnumeratorEnd {
            let testItem = this.m_enumerator.Next();
            while (!(testItem instanceof EnumeratorEnd) && !(this.m_clause(testItem))) {
                testItem = this.m_enumerator.Next();
            }
            return testItem;
        }
        Peek(): T | EnumeratorEnd {
            let testItem = this.m_enumerator.Peek();
            while (!(testItem instanceof EnumeratorEnd) && !(this.m_clause(testItem))) {
                testItem = this.m_enumerator.Next();
            }
            return testItem;
        }
    }

    class WhereEnumerable<T> extends Enumerable<T> implements IEnumerable<T> {
        m_clause: (value: T) => boolean;
        m_enumerable: IEnumerable<T>;

        constructor(enumerable: IEnumerable<T>, clause: (value: T) => boolean) {
            super();
            this.m_enumerable = enumerable;
            this.m_clause = clause;
        }

        GetEnumerator() : IEnumerator<T> {
            return new WhereEnumerator(this.m_enumerable, this.m_clause)
        }
    }

    //ORDER BY

    class OrderByEnumerator<T, TKey> implements IEnumerator<T>  {
        m_keySelector: (value: T) => TKey;
        m_comparer: IComparer<TKey>;

        m_lastMin: T | null = null;
        
        m_enumerable: IEnumerable<T>

        constructor(enumerable: IEnumerable<T>, keySelector: (value: T) => TKey, comparer: IComparer<TKey>) {
            this.m_enumerable = enumerable;
            this.m_keySelector = keySelector;
            this.m_comparer = comparer;
        }

        Next(): T | EnumeratorEnd {
            let testItem = this.Peek();

            if (testItem instanceof EnumeratorEnd) {
                return enumeratorEndInstance;
            }
            this.m_lastMin = testItem;
            return testItem;
        }
        Peek(): T | EnumeratorEnd {
            let en = this.m_enumerable.GetEnumerator();

            let currentMin: T | EnumeratorEnd = enumeratorEndInstance;
            let currentMinKey: TKey | null = null;

            let lastMinKey: TKey | null = null;
            if (this.m_lastMin) {
                lastMinKey = this.m_keySelector(this.m_lastMin);
            }

            let testItem = en.Next();

            while (!(testItem instanceof EnumeratorEnd)) {

                let key = this.m_keySelector(testItem);
                let oldCompare = lastMinKey == null ? null : this.m_comparer(key, lastMinKey);

                if (currentMin instanceof EnumeratorEnd) {
                    if (oldCompare === null || oldCompare === CompareResult.Larger) {
                        currentMin = testItem;
                        currentMinKey = this.m_keySelector(testItem);
                    }
                } else {
                    let comparison = currentMinKey === null ? null : this.m_comparer(key, currentMinKey);
                    
                    if (comparison === CompareResult.Smaller && (lastMinKey === null || oldCompare === CompareResult.Larger)) {
                        currentMin = testItem;
                        currentMinKey = key;
                    }
                }

                testItem = en.Next();
            }
            
            if (currentMin instanceof EnumeratorEnd) {
                return enumeratorEndInstance;
            }
            return currentMin;
        }
        Reset(): void {
            this.m_lastMin = null;
        }
    }
    
    class OrderByEnumerable<T, TKey> extends Enumerable<T> implements IEnumerable<T> {
        m_keySelector: (value: T) => TKey;
        m_comparer: IComparer<TKey>;

        m_enumerable: IEnumerable<T>;

        constructor(enumerable: IEnumerable<T>, keySelector: (value: T) => TKey, comparer: IComparer<TKey>) {
            super();
            this.m_enumerable = enumerable;
            this.m_keySelector = keySelector;
            this.m_comparer = comparer;
        }

        GetEnumerator() : IEnumerator<T> {
            return new OrderByEnumerator(this.m_enumerable, this.m_keySelector, this.m_comparer);
        }
    }

    //APPEND

    class AppendEnumerator<T> implements IEnumerator<T> {
        m_enumerable1: IEnumerable<T>;
        m_enumerator1: IEnumerator<T>;
        m_enumerable2: IEnumerable<T>;
        m_enumerator2: IEnumerator<T>;

        constructor(enumerable1: IEnumerable<T>, enumerable2: IEnumerable<T>) {
            this.m_enumerable1 = enumerable1;
            this.m_enumerator1 = enumerable1.GetEnumerator();
            this.m_enumerable2 = enumerable2;
            this.m_enumerator2 = enumerable2.GetEnumerator();
        }

        Next(): T | EnumeratorEnd {
            let testItem = this.m_enumerator1.Next();
            if (testItem instanceof EnumeratorEnd) {
                testItem = this.m_enumerator2.Next();
            }
            return testItem;
        }
        Peek(): T | EnumeratorEnd {
            let testItem = this.m_enumerator1.Peek();
            if (testItem instanceof EnumeratorEnd) {
                testItem = this.m_enumerator2.Peek();
            }
            return testItem;
        }
    }

    class AppendEnumerable<T> extends Enumerable<T> implements IEnumerable<T> {
        m_enumerable1: IEnumerable<T>;
        m_enumerable2: IEnumerable<T>;

        constructor(enumerable1: IEnumerable<T>, enumerable2: IEnumerable<T>) {
            super();
            this.m_enumerable1 = enumerable1;
            this.m_enumerable2 = enumerable2;
        }

        GetEnumerator() : IEnumerator<T> {
            return new AppendEnumerator(this.m_enumerable1, this.m_enumerable2)
        }
    }

    //JOIN

    class JoinEnumerator<T, U, K, J> implements IEnumerator<J> {
        m_enumerable1: IEnumerable<T>;
        m_enumerator1: IEnumerator<T>;
        m_enumerable2: IEnumerable<U>;

        m_keygen1: (v: T)=> K;
        m_keygen2: (v: U)=> K;
        
        m_joiner: (v1: T, v2: U)=> J;

        constructor(enumerable1: IEnumerable<T>, enumerable2: IEnumerable<U>, key1: (v: T)=>K, key2: (v:U)=>K, joiner: (v1: T, v2: U)=> J) {
            this.m_enumerable1 = enumerable1;
            this.m_enumerator1 = enumerable1.GetEnumerator();
            this.m_enumerable2 = enumerable2;
            
            this.m_keygen1 = key1;
            this.m_keygen2 = key2;
            this.m_joiner = joiner;
        }

        Next(): J | EnumeratorEnd {
            let testItem = this.m_enumerator1.Next();
            while (!(testItem instanceof EnumeratorEnd)) {

                var key1 = this.m_keygen1(testItem);
                //Find match in other enumerator.
                var item2 = this.m_enumerable2.Where((u)=> this.m_keygen2(u) === key1).First();
                
                if (!(item2 instanceof EnumeratorEnd)) {
                    return this.m_joiner(testItem, item2);
                }
    
                testItem = this.m_enumerator1.Next();
            }
            return enumeratorEndInstance;
        }

        Peek(): J | EnumeratorEnd {
            let testItem = this.m_enumerator1.Peek();
            if (!(testItem instanceof EnumeratorEnd)) {

                var key1 = this.m_keygen1(testItem);
                //Find match in other enumerator.
                var item2 = this.m_enumerable2.Where((u)=> this.m_keygen2(u) === key1).First();
                
                if (!(item2 instanceof EnumeratorEnd)) {
                    return this.m_joiner(testItem, item2);
                }
            }
            return enumeratorEndInstance;
        }
    }

    class JoinEnumerable<T, U, K, J> extends Enumerable<J> implements IEnumerable<J> {
        m_enumerable1: IEnumerable<T>;
        m_enumerable2: IEnumerable<U>;

        m_keygen1: (v: T)=> K;
        m_keygen2: (v: U)=> K;
        
        m_joiner: (v1: T, v2: U)=> J;

        constructor(enumerable1: IEnumerable<T>, enumerable2: IEnumerable<U>, key1: (v: T)=>K, key2: (v:U)=>K, joiner: (v1: T, v2: U)=> J) {
            super();
            this.m_enumerable1 = enumerable1;
            this.m_enumerable2 = enumerable2;
            this.m_keygen1 = key1;
            this.m_keygen2 = key2;
            this.m_joiner = joiner;
        }

        GetEnumerator() : IEnumerator<T> {
            return new JoinEnumerator(this.m_enumerable1, this.m_enumerable2, this.m_keygen1, this.m_keygen2, this.m_joiner);
        }
    }
}