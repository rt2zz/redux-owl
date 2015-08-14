import {forEach} from 'lodash'
import invariant from 'invariant'

export var INITIALIZE = 'owl/INITIALIZE'

export function createOwlAction(types, payload, config){
  var baseType = Array.isArray(types) ? types[0] : types
  types = Array.isArray(types) ? types : [baseType, baseType+'_SUCCESS', baseType+'_FAIL']

  return {
    type: baseType,
    payload: payload,
    owl: {
      contract: {
        types: types,
        config: config,
      },
      id: Math.floor(Math.random()*9999999999),
      handled: false,
      phase: 'REQUEST',
      attempt: 1,
    },
  }
}

export function handleOwlAction(action, dispatch, cb){
  invariant(typeof action.owl === 'object', 'owl cannot process action without owl meta')
  action.owl.handled = true
  cb(success, fail)
  function success(){
    let successAction = {
      ...action,
      type: action.owl.contract.types[1],
      owl: {...action.owl, phase: 'SUCCESS'},
    }
    dispatch(successAction)
  }
  function fail(){
    let failAction = {
      ...action,
      type: action.owl.contract.types[2],
      owl: {...action.owl, phase: 'FAIL'},
    }
    dispatch(failAction)
  }
}

var initialState = {
  processing: {},
  retry: {},
}
export function owlReducer(state = initialState, action){
  if(action.type === INITIALIZE){
    let processing = {...state.processing}
    let retry = {...state.retry}
    forEach(processing, (latentAction, id) => {
      retry[id] = latentAction
      delete processing[id]
    })
    return {...state, processing, retry}
  }
  if(action.owl){
    invariant(action.owl.handled === true, 'owl action must be handled before it hits reducer!')
    if(action.owl.phase === 'REQUEST'){
      //move to processing
      let processing = {...state.processing}
      processing[action.owl.id] = action
      let retry = {...state.retry}
      delete retry[action.owl.id]
      return {...state, processing: processing, retry: retry}
    }
    if(action.owl.phase === 'SUCCESS'){
      //clear from queues
      let processing = {...state.processing}
      delete processing[action.owl.id]
      let retry = {...state.retry}
      delete retry[action.owl.id]
      return {...state, processing, retry}
    }
    if(action.owl.phase === 'FAIL'){
      //move to retry
      let processing = {...state.processing}
      delete processing[action.owl.id]
      let retry = {...state.retry}
      retry[action.owl.id] = action
      return {...state, processing, retry}
    }
  }
  else{
    return state
  }
}

export function enableOwl({dispatch, getState}, config){
  let owlKey = config.key || 'owl'

  dispatch(initialize())

  function process(){
    let owl = getState()[owlKey]
    forEach(owl.retry, (action) => {
      dispatch(createRetryAction(action))
    })
  }

  //more advanced triggering plz
  setTimeout(process, 100)
  setInterval(process, 1000*30)
}

function initialize(){
  return {
    type: INITIALIZE
  }
}

function createRetryAction(action){
  return {
    ...action,
    type: action.owl.contract.types[0],
    owl: { ...action.owl, phase: 'REQUEST', attempt: action.owl.attempt+1 },
  }
}
