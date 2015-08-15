# Redux Owl
Redux One Way Linking

This is a simple method for supporting offline sync. When two way concurrency such as scuttlebutt/CRDT is not possible (e.g. third party api's) or is not desired (complexity), this is a simple alternative.  

The basic concept is, try to execute the action, on failure add it to a retry queue. Every so often process the retry queue until success is achieved.  

To function properly your app will also need to support the following:
- State persistence ([redux-persist](https://github.com/rt2zz/redux-persist) or [redux-localstorage](https://github.com/elgerlambert/redux-localstorage))
- Side effects are triggered by actions ([redux-remotes](https://github.com/rt2zz/redux-remotes) or [other middleware](https://github.com/rackt/redux/blob/master/examples/real-world/middleware/api.js))

### @TODO
improve api (reducer vs store enhancer?)
add processing rules
- configurable per action retry back off
- configurable processing (interval, network monitor)
- should process ever accelerate back off schedule? e.g. network monitor returns true
- extract basic `retry action` logic into seperate module. Have owl focus more on the network layer.

Setup
```js
import {owlReducer, enableOwl} from 'redux-owl'
import {persistStore} from 'redux-persist'

const reducer = combineReducers({
  ...otherReducers,
  owl: owlReducer,
})

//...

persistStore(store, {}, (err) => {
  //does not depend on redux-persist, but be sure enable owl
  //after persistence is complete
  enableOwl(store, {})
})
```
ActionCreator
```js
import {createOwlAction } from 'redux-owl'

export function createRecordTest(record) {
  return createOwlAction('RECORD_INSERT', record, {})
}
```
Async Action / Side Effects
```js
import { remoteActionMap } from 'redux-remotes'
import { handleOwlAction } from 'redux-owl'

export default remoteActionMap({
  RECORD_INSERT({action, getState, dispatch, finish}){
    handleOwlAction(action, finish, (success, fail) => {
      if(Math.random() > .5){ setTimeout(success, 1000) }
      else { setTimeout(fail, 1000) }
    })
  }
})
```
