# Redux Owl
Redux One Way Linking

This is a simple method for supporting offline sync. When two way concurrency such as scuttlebutt/CRDT is not possible (e.g. third party api's) or is not desired (complexity), this is a simple alternative.

The basic concept is, try to execute the action, on failure add it to a retry queue. Every so often process the retry queue until success is achieved.

### @TODO
improve api (reducer vs store enhancer?)
add processing rules
- configurable per action retry back off
- configurable processing (interval, network monitor)
- should process ever accelerate back off schedule? e.g. network monitor returns true

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
    console.log('record insert remote')
    handleOwlAction(action, finish, (success, failure) => {
      if(Math.random() > .8){ setTimeout(success, 1000) }
      else { setTimeout(failure, 1000) }
    })
  }
})
```
