# Spiccato-React

`Spiccato-React` makes it easy to organize your react state management with `spiccato`. It provides simple to use hooks and wrapper components to quickly subscribe your components to a `spiccato` state manager. 

**Index**

- [Installation & Usage](#installation--usage)
- [Package Exports](#package-exports)
- [useSpiccatoState](#usespiccatostate)
- [subscribe](#subscribe)
- [What to Use & When](#what-to-use-and-when)
---
## Installation & Usage

`Spiccato-React` has one dependency of `spiccato`. Ensure you have both packages installed. 

```
npm i spiccato spiccato-react
```

To use your spiccato state in any of your components, you need to make sure your `spiccato` instance has been mounted in your program. To do this you can either initialize your state manager inline in a file that is mounted near the head of your projects, or you can import your state manager into the head of your project.

---

## Package Exports 

`Spiccato-React` has two exports: `useSpiccatoState`, which is a high level hook to be used in your functional components, and `subscribe`, which offers similar functionality by way of a higher order component that encapsulates additional benefits.  

To import: 

```javascript
import {useSpiccatoState, subscribe} from 'spiccato-react';
```
---

## useSpiccatoState

`useSpiccatoState` offers you easy and efficient access to your `spiccato` state in your functional components. If you are primarily using functional components, this is the easiest way to access to your global `spiccato` state.

Assume that following `spiccato` initialization:

```JavaScript
/* manager.js */

import Spiccato from 'spiccato'

const manager = new Spiccato({
        count: 0,
        user: {
            name: "John Doe",
            cell: 5555555
        }
    },
    {id: "myAwesomeManager"} // this id is how we will reference our manager later
)

manager.init()

export default manager
```
Then, in the main executing file of your project (probably something like `index.js` or `main.js`), import your manager so it is mounted in your project.

```javascript
/* index.js */

import manager from './manager'

/* Other initialization code here... */
```
And finally, in our functional component, we can do the following:

```JavaScript
import {useSpiccatoState} from 'spiccato-react';

function myComponent(){
    
    const { state, manager } = useSpiccatoState(
        "myAwesomeManager", // the manager id OR the instance itself
        ["count", ["user", "cell"]] // state dependencies
    )

    return (
        /* My JSX Here */
    )
}
```

`useSpiccatoState` accepts two arguments. The first is either the ID of your manager, or the manager instance itself. Second is a path definition (see [addEventListener](https://www.npmjs.com/package/spiccato#addeventlistener) in the spiccato docs for more details on path definitions). The state will only update when the value at a give path has changed. 

`useSpiccatoState` returns an object with two properties: `state` and `manager`. The state is a copy to the specified paths in your `spiccato` state. The `manager` is the manager instance itself. From this, you can access all normal `spiccato` instance methods, such as `getters`, `setters`, `methods`, etc. 

In this example, state would equal the following:

```javascript
{
    count: 0,
    user: {cell: 5555555}
}
```

Notice how additional nested values are not included. This state will only update when `count` or `user.cell` are changed. 

If you want this local state to update when any part of your spiccato state updates, set the dependencies array to `["*"]`. The state object you receive will be a clone of your `spiccato` state.

---
## subscribe

The `subscribe` export is actually a `higher order component` that takes in a react component and an array of `manager definitions`. Manager definitions are objects with two keys: `spiccatoManager` (either a `spiccato` instance or an ID associated with a `spiccato` instance) and a `dependencies` array (Array<string | string[] | spiccato paths object>). These definitions are effectively what you pass to a call to `useSpiccatoState`, but you can pass multiple definitions to one `subscribe` call. 

```javascript
import Spiccato from 'spiccato';
import { subscribe } from `spiccato-react` 

const manager = new Spiccato({count: 0, user: {name: "", cell: ""}}, {id: "subscribeDemo"});

const MyComponent = (props) => {
    console.log(props.spiccatoState) // => {subscribeDemo: {count: 0, user: {cell: ""}}}
    /* Implement Component Here... */
}

subscribe(
    MyComponent,
    [
        {
            spiccatoManager: manager, // You can also pass in the manager id, "subscribeDemo"
            dependencies: [manager.paths.count, manager.paths.user.cell]
        }
    ]
)
```

`Subscribe` embeds a `spiccatoState` parameter in the `props` of your component. This `spiccatoState` parameter then has a list of keys matching the IDs of your managers to their specified state. In this instance, `spiccatoState` has a key called `subscribeDemo`, and its value is the state specified in the dependencies array: `{count: 0, user: {cell: ""}}`.

Similar to the `useSpiccatoState` hook, this state will update only when one of the specified dependencies updates. If you want to subscribe to all state updates, simply set your dependencies array to `["*"]`. 

---

## What to Use and When

### useSpiccatoState

`useSpiccatoState` is a hook, and therefore is designed to simplify your code inside a functional component. If you are looking for a fast, efficient, and simple way to access your `spiccato` state inside a functional component, `useSpiccatoState` is a good choice. However, it's important to note that basic react component execution principles still hold true. `useSpiccatoState` will not cause unnecessary re-executions of your component, but if the parent component updates, the child component will fire again. In the even that you truly want the component to re-execute only when the `spiccato` state changes, you should use the `subscribe` HOC. 

### subscribe 

`subscribe` performs a similar function, but is not bound to functional components. It is also slightly more efficient in blocking unnecessary executions of your component because is uses React `memo` under the hood. Given these benefits, you should use `subscribe` when:

- You are not using a functional component (i.e. a class component)
- You only want your component to execute when the associated state or props change (and not when the parent node updates)

---


