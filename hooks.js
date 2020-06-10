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
