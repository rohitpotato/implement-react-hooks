# implement-react-hooks
A simplified implementation of two of the most important react hooks - useState and useEffect

### Original Article: 
https://medium.com/swlh/learn-by-implementing-reacts-usestate-and-useeffect-a-simplified-overview-ea8126705a88

# Learn by implementing React's useState and useEffect - A simplified overview

Although React hooks were first introduced back in 2018, I started using them not too long ago.
Hooks are great! Clean Code, easier to debug, functional components and most importantly: you don't have to worry about this anymore. All this is great, but there were a few questions that remained unanswered for me.

<i>How does it work?</i>

<i>Since functional components are just functions, How do components preserve their previous state after each re-render?</i>

These questions tempted me to research a bit more about how hooks work under the hood. 
I started to research the topic and there a lot of excellent explanations out there. 
But for me, I couldn't wrap my head around it until I implemented it on my own.

So today, we are going to implement probably the most common hooks you'll use in a typical application: useState and useEffect.
Before we get started, we need to understand closures a little bit.

### Closures:

  According to MDN, <i>closure gives you access to an outer function's scope from an inner function. In JavaScript, closures are created every time a function is created, at function creation time.</i>

  According to w3Schools, <i>it allows a function to have "private" variables.</i>

  These two statements are extremely important to understand how hooks work. 

  Therefore, to understand closures, we'll go through a simple example

  ```
  function outerFunction() {
    let counter = 0;  // defined outside inner function
    return function innerFunction() {
      counter = counter + 1;  // counter accessible inside inner function (private variable)
      return counter;
    }
}

const getInnerFunction = outerFunction();

console.log(getInnerFunction())   // prints 1
console.log(getInnerFunction())   // prints 2
console.log(getInnerFunction())   // prints 3
console.log(getInnerFunction())   // prints 4
```

Notice how the inner function still has access to the variable counter defined in the scope of the outer function even after the function has finished executing. 

The inner function "preserves" the value of the counter and at each function call, it remembers the previous value of the variable.

Also, the variable counter is not available anywhere else except outside outerFunction ( try to access counter anywhere in the code outside the function ). Hence, the w3Schools statement holds as well.

Now let's get back to where we were, hooks!

## Let's start with the overall structure:

<i><b>Note: This is an oversimplified version of what happens under the hood, React doesn't use this to power their library.
</b></i>

 ```
 let React = (function() {
  let global = {}; // define a global variable where we store information about the component
  let index = 0; // index to keep track of the component's state
  function render(Component) {
    global.Component = Component;
    const instance = Component(); // get the instance of the component
    index = 0;
    instance.render();
    global.instance = instance; // store the component's instance for any future calls of the component's functions
    return global; // return the global variable
  }

  function useState(initialState) {
    // implement useState
  }

  function useEffect(cb, deps) {
    // implement useEffect
  }

  return { render, useState, useEffect };
})();
```

Let's break down the code once before we move forward. 
  
  <b>Step 1:</b> We define a global object to keep track of the component's properties. 
  
  <b>Step2:</b> Notice that we are using an index and initialized it to 0. This is used to keep track of the component's state. This is will become more clear later.
  
  <b>Step 3:</b> A render function which accepts a Component as a parameter and does a couple of things. 
  
  <b>Step 4:</b> It first calls the component, stores it's instance inside the global object so we can use this instance for any future function calls inside the component, 
  
  <b>Step 5:</b> Resets the index to 0 and returns the global variable.
 
Let's move forward and implement useState.
 
## useState:

``` 
function useState(initialState) {
    if (!global) {
      throw new Error("Need a global");
    }

    if (!global.hooks) {
      global.hooks = []; // this array holds the state of the component
    }

    const hooks = global.hooks;
    const currentState = global.hooks[index] || initialState; 
    hooks[index] = currentState;    // memoize the state for future access
    firstrender = true;
    
    const setState = (function() {
      let currentIndex = index; // copy the index so each useState call will have it's own "closed" value over index (currentIndex)
      return function(value) {
        global.hooks[currentIndex] = value;
        render(global.Component);   // re-render the component after state change.
      };
    })();
    index = index + 1;
    return [currentState, setState];
} 
```

### What's happening here? 


  <b>Step 1</b>: We initialize an empty array that will keep track of the component's state. If there's an already existing state, we get that state from the hooks array otherwise we set the state as the initial value (memorizing state).

  #### Let's look at the function setState:

  <b>Step 2:</b> Notice that we copy the value of index into currentIndex.

  We are leveraging the power of closures here. Each useState call saves the value of the index inside the variable currentIndex, therefore, with the help of closures, each useState has it's own preserved value of currentIndex which allows it to know the index at which it's data is stored inside the hooks array.

  #### Note: Each useState will have its own closure, therefore, it's own currentIndex before we increment it.

  <b>Step 3:</b> We take the new values and overwrite the previous state at the appropriate index and re-render the component.

  <b>Step 4:</b> Lastly, we increment the index for further useState calls to store their state inside the hooks array. That's why we need currentIndex to be preserved inside each closure.

## useEffect:

```   
function useEffect(cb, deps) {
      const hooks = global.hooks; 
    
      // getting older dependencies from the hooks array since 
      // we are storing dependencies as a sub-array inside the hooks array
      let oldDeps = hooks[index];
    
      // if no dependencies are provided, 
      // the callback function will be called at each re-render
      let hasChanged = true;    
    
      if (oldDeps) {
        // checking if the old dependencies are different from older dependencies
        hasChanged = deps.some((d, index) => !Object.is(d, oldDeps[index]));
      }
      if (hasChanged) cb();   // if dependencies has changed call the callback function.
    
      hooks[index] = deps;    //store dependencies inside the hooks array as a sub-array
      index++;    // increment index for any other useEffect calls
}
```

### Let's look at the useEffect function here.

  The function accepts a callback function and an array of dependencies similar to the original useEffect hook.

  We store the dependencies in the hooks array as a subarray. 

  For any further re-renders, we can check if the value of the dependencies has changed to trigger the callback function. 

  React uses ```Object.is()``` under the hood to compare values. 
  For any further useEffect functions inside our component, we increment the index so it can store its own dependencies at the next index in the hooks array.

  Now, let's write a basic React Component, we will monitor the value of ```global.hooks``` and ```index``` at each step.



Putting it all together, 

``` 
  let React = (function() {
  let global = {}; // define a global variable where we store information about the component
  let index = 0; // index to keep track of the component's state
  function render(Component) {
    global.Component = Component;
    const instance = Component(); // get the instance of the component
    index = 0;
    instance.render();  // call the component's render function
    
    global.instance = instance; // store the component's instance for any future calls of the component's functions
    return global; // return the global variable
  }

 function useState(initialState) {
    if (!global) {
      throw new Error("Need a global");
    }

    if (!global.hooks) {
      global.hooks = []; // this array holds the state of the component
    }

    const hooks = global.hooks;
    const currentState = global.hooks[index] || initialState; 
    hooks[index] = currentState;    // memoize the state for future access
    firstrender = true;
    
    const setState = (function() {
      let currentIndex = index; // copy the index so each useState call will have it's own "closed" value over index (currentIndex)
      return function(value) {
        global.hooks[currentIndex] = value;
        render(global.Component);   //re-render the component after state change
      };
    })();
    index = index + 1;
    return [currentState, setState];
  }

    function useEffect(cb, deps) {
      const hooks = global.hooks; 
    
      // getting older dependencies from the hooks array since 
      // we are storing dependencies as a sub-array inside the hooks array
      let oldDeps = hooks[index];
    
      // if no dependencies are provided, 
      // the callback function will be called at each re-render
      let hasChanged = true;    
    
      if (oldDeps) {
        // checking if the old dependencies are different from older dependencies
        hasChanged = deps.some((d, index) => !Object.is(d, oldDeps[index]));
      }
      if (hasChanged) cb();   // if dependencies has changed call the callback function.
    
      hooks[index] = deps;    //store dependencies inside the hooks array as a sub-array
      index++;    // increment index for any other useEffect calls
  } 

  return { render, useState, useEffect };
})();

function Component() {

  // Component is called at each re-render. index is reset to 0.
  
  const [count, setCount] = React.useState(0);
  // hooks: [0], currentIndex: 0,  Incremented Index: 1
  
  const [word, setWord] = React.useState("");
  // hooks: [0, ''], currentIndex: 1,  Incremented Index: 2
  
  const countSetter = () => {
    setCount(count + 1);
  };

  const wordSetter = word => {
    setWord(word);
  };

  function render() {
    console.log(`Count is: ${count}, Word is: ${word}`);
  }

  React.useEffect(() => {
    console.log("hookssss!!!!");
  }, [count, word]);
   // hooks: [0, '', [0, '']], currentIndex: 2,  Incremented Index: 3
  
  React.useEffect(() => {
    console.log("hooks2!!!!!");
  }, []);
  // hooks: [0, '', [0, ''], [] ], currentIndex: 3,  Incremented Index: 4
  
  return { render, countSetter, wordSetter };
}

const global = React.render(Component);     // hooks: [ 0, '', [ 0, '' ], [] ]
global.instance.countSetter();              // hooks: [ 1, '', [ 1, '' ], [] ]
global.instance.countSetter();              // hooks: hooks: [ 2, '', [ 2, '' ], [] ]
global.instance.countSetter();              // hooks: [ 3, '', [ 3, '' ], [] ]
global.instance.wordSetter("yooo");         // hooks: [ 3, 'yooo', [ 3, 'yooo' ], [] ]
global.instance.wordSetter("ssup");         // hooks: [ 3, 'yooo', [ 3, 'yooo' ], [] ] 

```

Notice that the first useEffect hook runs every time the value of count or word is changed, triggers a re-render and the second useEffect hook runs only one time.
Neat, right?

There are a ton of articles out there explaining and I couldn't have wrapped my head around it without their help. 
