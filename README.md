# TINQ
LINQ for Typescript

## How to use:

1. Add Tinq.ts to your project.

2. Import the Linq module.
```
import { Linq } from './Tinq';
```

3. Create an IEnumerable.

You can either create an IEnumerable from an array:
```
let transforms = Tinq.FromArray(actions.transforms);
```

Or create a range:
```
let range = Tinq.Range(0, 5);
```

4. Use the classic LINQ API.
```
let transforms = Linq.FromArray(actions.transforms).Where((t) => t.adjustment < 0);
transforms.ForEach(t => {
  console.log(t.adjustment);
});
```

## Why use this over regular arrays?

The Linq API (and by extensions Tinq) lets you create lazy-evaluated operators. 

Imagine you have a large array, and want to do complicated operations like join multiple arrays, filter, sort, etc. 
Traditional Javascript operations to do this will either create multiple copies of the array, or result in a lot of boilerplate and bespoke code.

In contrast, Tinq will never clone the array (unless you explicitly ask it to) and will run whatever arbitrarily-complicated process on the array. 
Additionally the `Tinq.Range` method will return an IEnumerable that allows you to iterate/process a collection without creating an array at all.
